package co.hyperflex.precheck.concrete.cluster;

import co.hyperflex.clients.elastic.ElasticClient;
import co.hyperflex.clients.elastic.dto.cat.shards.ShardsRecord;
import co.hyperflex.precheck.contexts.ClusterContext;
import co.hyperflex.precheck.core.BaseClusterPrecheck;
import java.util.List;
import org.slf4j.Logger;
import org.springframework.stereotype.Component;

@Component
public class NoRelocatingShardsPrecheck extends BaseClusterPrecheck {

  @Override
  public String getName() {
    return "No relocating shards";
  }

  @Override
  public void run(ClusterContext context) {
    ElasticClient client = context.getElasticClient();
    Logger logger = context.getLogger();

    List<ShardsRecord> shards = client.getShards();
    List<ShardsRecord> relocatingShards =
        shards.stream().filter(s -> "RELOCATING".equalsIgnoreCase(s.getState())).toList();

    for (ShardsRecord shard : relocatingShards) {
      logger.error("Relocating shard: index={}, shard={}, from={}", shard.getIndex(), shard.getShard(),
          shard.getNode());
    }

    if (!relocatingShards.isEmpty()) {
      logger.error("Relocating shards check failed. {} shard(s) are currently relocating.", relocatingShards.size());
      throw new RuntimeException();
    } else {
      logger.info("Relocating shards check succeeded. There is no relocating shards.");
    }
  }
}
