package co.hyperflex.precheck.concrete.index;

import co.hyperflex.clients.elastic.dto.cat.shards.ShardsRecord;
import co.hyperflex.clients.elastic.dto.cluster.AllocationExplainRequest;
import co.hyperflex.clients.elastic.dto.cluster.AllocationExplainResponse;
import co.hyperflex.precheck.contexts.IndexContext;
import co.hyperflex.precheck.core.BaseIndexPrecheck;
import co.hyperflex.precheck.core.enums.PrecheckSeverity;
import java.util.List;
import org.slf4j.Logger;
import org.springframework.stereotype.Component;

@Component
public class UnassignedShardsPrecheck extends BaseIndexPrecheck {

  @Override
  public String getName() {
    return "Unassigned or Initializing Shards Check";
  }

  @Override
  public void run(IndexContext context) {
    String indexName = context.getIndexName();
    var client = context.getElasticClient();
    Logger logger = context.getLogger();

    List<ShardsRecord> shardRecords = client.getShards(indexName);

    List<ShardsRecord> unassignedShards = shardRecords.stream()
        .filter(s -> "UNASSIGNED".equalsIgnoreCase(s.getState()))
        .toList();

    List<ShardsRecord> initializingShards = shardRecords.stream()
        .filter(s -> "INITIALIZING".equalsIgnoreCase(s.getState()))
        .toList();

    if (!unassignedShards.isEmpty() || !initializingShards.isEmpty()) {
      logger.warn("Index [{}] has unassigned or initializing shards.", indexName);

      for (ShardsRecord shard : unassignedShards) {
        if (shard.getShard() != null && !shard.getShard().isEmpty()) {
          try {
            int shardId = Integer.parseInt(shard.getShard());
            boolean isPrimary = "p".equalsIgnoreCase(shard.getPrirep());

            AllocationExplainResponse explain = client.getAllocationExplanation(new AllocationExplainRequest(
                indexName, shardId, isPrimary
            ));

            String explanation = explain.getAllocateExplanation() != null
                ? explain.getAllocateExplanation()
                : "No details available";

            logger.info(
                "Unassigned shard [{}] (primary: {}) explanation: {}",
                shard.getShard(), isPrimary, explanation
            );
          } catch (NumberFormatException e) {
            logger.warn("Skipping invalid shard number: [{}]", shard.getShard());
          }
        }
      }

      throw new RuntimeException("Index has unassigned or initializing shards.");
    } else {
      logger.info("Index [{}] has all shards in assigned and started state.", indexName);
    }
  }

  @Override
  public PrecheckSeverity getSeverity() {
    return PrecheckSeverity.WARNING;
  }
}
