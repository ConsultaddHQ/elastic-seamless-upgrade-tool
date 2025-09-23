package co.hyperflex.precheck.concrete.node.elastic;

import co.hyperflex.clients.elastic.ElasticClient;
import co.hyperflex.clients.elastic.dto.nodes.Ingest;
import co.hyperflex.clients.elastic.dto.nodes.NodesStatsResponse;
import co.hyperflex.clients.elastic.dto.nodes.Stats;
import co.hyperflex.precheck.contexts.NodeContext;
import co.hyperflex.precheck.core.BaseElasticNodePrecheck;
import co.hyperflex.precheck.core.enums.PrecheckSeverity;
import java.util.Map;
import java.util.Optional;
import org.slf4j.Logger;
import org.springframework.stereotype.Component;

@Component
public class IngestLoadPrecheck extends BaseElasticNodePrecheck {

  private static final int THROUGHPUT_THRESHOLD = 1000; // Docs/sec

  @Override
  public String getName() {
    return "Ingest Node Load Check";
  }

  @Override
  public PrecheckSeverity getSeverity() {
    return PrecheckSeverity.WARNING;
  }

  @Override
  public void run(NodeContext context) {
    String nodeId = context.getNode().getId();
    ElasticClient client = context.getElasticClient();
    Logger logger = context.getLogger();

    NodesStatsResponse statsResponse = client.getNodesMetric(nodeId, "stats/ingest");

    Map<String, Stats> nodes = statsResponse.getNodes();
    Stats nodeStats = nodes.get(nodeId);

    if (nodeStats == null) {
      throw new RuntimeException("Node with ID [" + nodeId + "] not found.");
    }

    String nodeName = nodeStats.getName();

    var ingestTotal = Optional.ofNullable(nodeStats.getIngest()).map(Ingest::getTotal).orElse(null);

    if (ingestTotal == null || ingestTotal.getCount() == 0 || ingestTotal.getTimeInMillis() == 0) {
      logger.info("{}: Skipping ingest load check — no activity data.", nodeName);
      return;
    }

    double docsPerSec = ingestTotal.getCount() / (ingestTotal.getTimeInMillis() / 1000.0);
    String docsPerSecRounded = String.format("%.2f", docsPerSec);

    logger.info("{}: Ingested {} docs in {} ms → ~{} docs/sec", nodeName, ingestTotal.getCount(),
        ingestTotal.getTimeInMillis(), docsPerSecRounded);

    if (docsPerSec > THROUGHPUT_THRESHOLD) {
      logger.warn("{}: Ingest load is high ({} docs/sec). Threshold: {} docs/sec.", nodeName,
          docsPerSecRounded, THROUGHPUT_THRESHOLD);
    }

  }
}
