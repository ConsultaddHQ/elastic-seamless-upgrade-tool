package co.hyperflex.upgrade.tasks.elastic;

import co.hyperflex.clients.elastic.ElasticClient;
import co.hyperflex.clients.elastic.dto.cluster.PutClusterSettingsResponse;
import co.hyperflex.upgrade.tasks.Context;
import co.hyperflex.upgrade.tasks.Task;
import co.hyperflex.upgrade.tasks.TaskResult;
import java.util.HashMap;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class EnableShardAllocationTask implements Task {

  @Override
  public String getName() {
    return "Enable Shard Allocation";
  }

  @Override
  public TaskResult run(Context context) {
    ElasticClient elasticsearchClient = context.elasticClient();

    Map<String, Object> transientSettings = new HashMap<>();
    transientSettings.put("cluster.routing.allocation.enable", "all");
    transientSettings.put("cluster.routing.allocation.node_concurrent_recoveries", 5);
    transientSettings.put("indices.recovery.max_bytes_per_sec", "500mb");

    Map<String, Object> clusterSettings = Map.of(
        "transient",
        transientSettings
    );

    PutClusterSettingsResponse response = elasticsearchClient.updateClusterSettings(clusterSettings);
    if (!response.isAcknowledged()) {
      throw new IllegalStateException("Disabling allocation failed");
    }
    return TaskResult.success("Shard allocation disabled");
  }
}
