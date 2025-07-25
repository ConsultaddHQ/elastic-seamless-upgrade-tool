package co.hyperflex.prechecks.concrete.cluster;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch.cluster.GetClusterSettingsRequest;
import co.elastic.clients.elasticsearch.cluster.GetClusterSettingsResponse;
import co.elastic.clients.json.JsonData;
import co.hyperflex.entities.precheck.PrecheckSeverity;
import co.hyperflex.prechecks.contexts.ClusterContext;
import co.hyperflex.prechecks.core.BaseClusterPrecheck;
import co.hyperflex.prechecks.core.PrecheckLogger;
import java.io.IOException;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class ClusterAllocationSettingPrecheck extends BaseClusterPrecheck {

  @Override
  public String getName() {
    return "Cluster allocation setting check";
  }

  @Override
  public PrecheckSeverity getSeverity() {
    return PrecheckSeverity.WARNING;
  }

  @Override
  public void run(ClusterContext context) {
    ElasticsearchClient client = context.getElasticClient().getElasticsearchClient();
    PrecheckLogger logger = context.getLogger();

    try {
      GetClusterSettingsResponse settings = client.cluster().getSettings(
          GetClusterSettingsRequest.of(req -> req
              .flatSettings(true)
              .includeDefaults(false)
          )
      );

      Map<String, JsonData> transientSettings = settings.transient_();
      Map<String, JsonData> persistentSettings = settings.persistent();

      String allocationSetting =
          transientSettings.getOrDefault("cluster.routing.allocation.enable",
              persistentSettings.getOrDefault("cluster.routing.allocation.enable",
                  JsonData.of("all"))).toString();

      String message = String.format(
          "Current setting 'cluster.routing.allocation.enable' is '%s'.", allocationSetting);

      logger.info(message);

      if ("primaries".equalsIgnoreCase(allocationSetting)
          || "none".equalsIgnoreCase(allocationSetting)) {
        logger.warn(message);
        logger.warn(
            "This setting may prevent shard allocation and lead to red cluster status."
                + " Set it to 'all' before upgrade.");
        throw new RuntimeException(
            "Precheck failed: " + message);
      }

    } catch (IOException e) {
      throw new RuntimeException("Failed to fetch cluster settings", e);
    }
  }
}
