package co.hyperflex.prechecks.concrete.cluster;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch.cat.shards.ShardsRecord;
import co.hyperflex.entities.precheck.PrecheckSeverity;
import co.hyperflex.prechecks.contexts.ClusterContext;
import co.hyperflex.prechecks.core.BaseClusterPrecheck;
import co.hyperflex.prechecks.core.PrecheckLogger;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
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
    ElasticsearchClient client = context.getElasticClient().getElasticsearchClient();
    PrecheckLogger logger = context.getLogger();

    try {
      List<ShardsRecord> shards = client.cat().shards(s -> s
          .h("node")
      ).valueBody();

      Map<String, Integer> shardCountByNode = new HashMap<>();
      for (ShardsRecord shard : shards) {
        String node = shard.node();
        if (node == null || node.isEmpty()) {
          continue;
        }
        shardCountByNode.put(node, shardCountByNode.getOrDefault(node, 0) + 1);
      }

      List<String> nodeShardInfo = shardCountByNode.entrySet().stream()
          .map(e -> String.format("%s: %d", e.getKey(), e.getValue()))
          .collect(Collectors.toList());

      logger.info("Shard distribution per node:\n%s", String.join("\n", nodeShardInfo));

      List<Integer> counts = new ArrayList<>(shardCountByNode.values());
      if (counts.isEmpty()) {
        return;
      }

      int max = Collections.max(counts);
      int min = Collections.min(counts);
      int spread = max - min;

      if (spread > 10) {
        String msg = String.format(
            "Uneven shard distribution detected. Max: %d, Min: %d, Spread: %d. Expected spread <= 10.",
            max, min, spread);
        logger.error(msg);
        throw new RuntimeException(
        );
      }

    } catch (IOException e) {
      throw new RuntimeException("Failed to evaluate shard distribution", e);
    }
  }
}
