package co.hyperflex.prechecks.contexts.resolver;

import co.hyperflex.clients.ElasticClient;
import co.hyperflex.clients.ElasticsearchClientProvider;
import co.hyperflex.clients.KibanaClient;
import co.hyperflex.clients.KibanaClientProvider;
import co.hyperflex.entities.cluster.Cluster;
import co.hyperflex.entities.cluster.ClusterNode;
import co.hyperflex.entities.precheck.ClusterPrecheckRun;
import co.hyperflex.entities.precheck.IndexPrecheckRun;
import co.hyperflex.entities.precheck.NodePrecheckRun;
import co.hyperflex.entities.precheck.PrecheckRun;
import co.hyperflex.entities.upgrade.ClusterUpgradeJob;
import co.hyperflex.exceptions.NotFoundException;
import co.hyperflex.prechecks.contexts.ClusterContext;
import co.hyperflex.prechecks.contexts.IndexContext;
import co.hyperflex.prechecks.contexts.NodeContext;
import co.hyperflex.prechecks.contexts.PrecheckContext;
import co.hyperflex.prechecks.core.DBPrecheckLogger;
import co.hyperflex.repositories.ClusterNodeRepository;
import co.hyperflex.repositories.ClusterRepository;
import co.hyperflex.services.ClusterUpgradeJobService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class PrecheckContextResolver {
  private static final Logger LOG = LoggerFactory.getLogger(PrecheckContextResolver.class);
  private final ClusterRepository clusterRepository;
  private final ElasticsearchClientProvider elasticsearchClientProvider;
  private final KibanaClientProvider kibanaClientProvider;
  private final ClusterNodeRepository clusterNodeRepository;
  private final ClusterUpgradeJobService clusterUpgradeJobService;

  public PrecheckContextResolver(
      ClusterRepository clusterRepository,
      ElasticsearchClientProvider elasticsearchClientProvider,
      KibanaClientProvider kibanaClientProvider,
      ClusterNodeRepository clusterNodeRepository,
      ClusterUpgradeJobService clusterUpgradeJobService) {
    this.clusterRepository = clusterRepository;
    this.elasticsearchClientProvider = elasticsearchClientProvider;
    this.kibanaClientProvider = kibanaClientProvider;
    this.clusterNodeRepository = clusterNodeRepository;
    this.clusterUpgradeJobService = clusterUpgradeJobService;
  }


  public PrecheckContext resolveContext(PrecheckRun precheckRun) {
    String clusterId = precheckRun.getClusterId();
    ClusterUpgradeJob clusterUpgradeJob =
        clusterUpgradeJobService.getActiveJobByClusterId(clusterId);
    Cluster cluster = clusterRepository.findById(precheckRun.getClusterId()).orElseThrow(
        () -> new NotFoundException("Cluster not found: " + precheckRun.getClusterId()));

    ElasticClient elasticClient =
        elasticsearchClientProvider.getElasticsearchClientByClusterId(clusterId);
    KibanaClient kibanaClient =
        kibanaClientProvider.getKibanaClientByClusterId(clusterId);

    DBPrecheckLogger precheckLogger = new DBPrecheckLogger(precheckRun);

    switch (precheckRun) {
      case IndexPrecheckRun indexPrecheckRun -> {
        return new IndexContext(
            cluster,
            elasticClient,
            kibanaClient,
            indexPrecheckRun.getIndex().getName(),
            clusterUpgradeJob,
            precheckLogger
        );
      }
      case NodePrecheckRun nodePrecheckRun -> {
        ClusterNode clusterNode = clusterNodeRepository.findById(nodePrecheckRun.getNode().getId())
            .orElseThrow(() -> new NotFoundException(
                "Cluster node not found: " + nodePrecheckRun.getClusterId()));
        return new NodeContext(
            cluster,
            elasticClient,
            kibanaClient,
            clusterNode,
            clusterUpgradeJob,
            precheckLogger
        );
      }
      case ClusterPrecheckRun clusterPrecheckRun -> {
        return new ClusterContext(
            cluster,
            elasticClient,
            kibanaClient,
            clusterUpgradeJob,
            precheckLogger
        );
      }
      default ->
          throw new IllegalArgumentException("Unknown precheck type: " + precheckRun.getType());
    }
  }
}
