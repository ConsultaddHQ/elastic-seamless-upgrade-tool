package co.hyperflex.precheck.concrete.cluster;

import co.hyperflex.clients.elastic.ElasticClient;
import co.hyperflex.clients.elastic.dto.cat.shards.ShardsRecord;
import co.hyperflex.precheck.contexts.ClusterContext;
import co.hyperflex.precheck.core.BaseClusterPrecheck;
import co.hyperflex.precheck.core.enums.PrecheckSeverity;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.springframework.stereotype.Component;

@Component
public class EvenShardDistributionPrecheck extends BaseClusterPrecheck {

  @Override
  public String getName() {
    return "Even shard distribution across data nodes";
  }

  @Override
  public PrecheckSeverity getSeverity() {
    return PrecheckSeverity.WARNING;
  }

  @Override
  public void run(ClusterContext context) {
    ElasticClient client = context.getElasticClient();
    Logger logger = context.getLogger();

    List<ShardsRecord> shards = client.getShards();

    Map<String, Integer> shardCountByNode = new HashMap<>();
    for (ShardsRecord shard : shards) {
      String node = shard.getNode();
      if (node == null || node.isEmpty()) {
        continue;
      }
      shardCountByNode.put(node, shardCountByNode.getOrDefault(node, 0) + 1);
    }


    logger.info("Shard distribution per node:");
    shardCountByNode.entrySet().stream()
        .map(e -> String.format("%s: %d", e.getKey(), e.getValue()))
        .forEach(logger::info);


    List<Integer> counts = new ArrayList<>(shardCountByNode.values());
    if (counts.isEmpty()) {
      return;
    }

    int max = Collections.max(counts);
    int min = Collections.min(counts);
    int spread = max - min;

    if (spread > 10) {
      logger.error(
          "Uneven shard distribution detected. Max: {}, Min: {}, Spread: {}. Expected spread <= 10.",
          max, min, spread);
      throw new RuntimeException();
    }
  }
}
