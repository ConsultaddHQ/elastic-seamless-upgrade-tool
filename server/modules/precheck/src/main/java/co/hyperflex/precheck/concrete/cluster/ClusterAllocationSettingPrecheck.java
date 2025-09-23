package co.hyperflex.precheck.concrete.cluster;

import co.hyperflex.clients.elastic.dto.cluster.GetClusterSettingsResponse;
import co.hyperflex.precheck.contexts.ClusterContext;
import co.hyperflex.precheck.core.BaseClusterPrecheck;
import co.hyperflex.precheck.core.enums.PrecheckSeverity;
import java.util.Map;
import org.slf4j.Logger;
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
    Logger logger = context.getLogger();

    GetClusterSettingsResponse settings = context.getElasticClient().getClusterSettings();

    Map<String, Object> transientSettings = settings.getTransient();
    Map<String, Object> persistentSettings = settings.getPersistent();

    String allocationSetting = "all";

    String clusterRoutingAllocationEnable = "cluster.routing.allocation.enable";
    if (transientSettings.containsKey(allocationSetting)) {
      allocationSetting =
          persistentSettings.get(clusterRoutingAllocationEnable).toString();
    } else if (persistentSettings.containsKey(allocationSetting)) {
      allocationSetting =
          transientSettings.get(clusterRoutingAllocationEnable).toString();
    }


    String message = String.format(
        "Current setting 'cluster.routing.allocation.enable' is '%s'.", allocationSetting);


    if ("primaries".equalsIgnoreCase(allocationSetting)
        || "none".equalsIgnoreCase(allocationSetting)) {
      logger.warn(message);
      logger.warn(
          "This setting may prevent shard allocation and lead to red cluster status."
              + " Set it to 'all' before upgrade.");
      throw new RuntimeException();
    } else {
      logger.info(message);
    }

  }
}
