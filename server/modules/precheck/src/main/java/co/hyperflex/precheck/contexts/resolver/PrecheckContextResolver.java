package co.hyperflex.precheck.contexts.resolver;

import co.hyperflex.clients.elastic.ElasticClient;
import co.hyperflex.clients.elastic.ElasticsearchClientProvider;
import co.hyperflex.clients.kibana.KibanaClient;
import co.hyperflex.clients.kibana.KibanaClientProvider;
import co.hyperflex.common.exceptions.NotFoundException;
import co.hyperflex.core.entites.clusters.ClusterEntity;
import co.hyperflex.core.entites.clusters.nodes.ClusterNodeEntity;
import co.hyperflex.core.repositories.ClusterNodeRepository;
import co.hyperflex.core.repositories.ClusterRepository;
import co.hyperflex.core.services.upgrade.ClusterUpgradeJobService;
import co.hyperflex.core.upgrade.ClusterUpgradeJobEntity;
import co.hyperflex.precheck.contexts.ClusterContext;
import co.hyperflex.precheck.contexts.IndexContext;
import co.hyperflex.precheck.contexts.NodeContext;
import co.hyperflex.precheck.contexts.PrecheckContext;
import co.hyperflex.precheck.entities.ClusterPrecheckRunEntity;
import co.hyperflex.precheck.entities.IndexPrecheckRunEntity;
import co.hyperflex.precheck.entities.NodePrecheckRunEntity;
import co.hyperflex.precheck.entities.PrecheckRunEntity;
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


  public PrecheckContext resolveContext(PrecheckRunEntity precheckRun) {
    String clusterId = precheckRun.getClusterId();
    ClusterUpgradeJobEntity clusterUpgradeJob =
        clusterUpgradeJobService.getActiveJobByClusterId(clusterId);
    ClusterEntity cluster = clusterRepository.findById(precheckRun.getClusterId()).orElseThrow(
        () -> new NotFoundException("Cluster not found: " + precheckRun.getClusterId()));

    ElasticClient elasticClient =
        elasticsearchClientProvider.getClient(clusterId);
    KibanaClient kibanaClient =
        kibanaClientProvider.getClient(clusterId);


    switch (precheckRun) {
      case IndexPrecheckRunEntity indexPrecheckRun -> {
        return new IndexContext(
            cluster,
            elasticClient,
            kibanaClient,
            indexPrecheckRun.getIndex().getName(),
            clusterUpgradeJob,
            LOG
        );
      }
      case NodePrecheckRunEntity nodePrecheckRun -> {
        ClusterNodeEntity clusterNode = clusterNodeRepository.findById(nodePrecheckRun.getNode().id())
            .orElseThrow(() -> new NotFoundException(
                "Cluster node not found: " + nodePrecheckRun.getClusterId()));
        return new NodeContext(
            cluster,
            elasticClient,
            kibanaClient,
            clusterNode,
            clusterUpgradeJob,
            LOG
        );
      }
      case ClusterPrecheckRunEntity clusterPrecheckRun -> {
        return new ClusterContext(
            cluster,
            elasticClient,
            kibanaClient,
            clusterUpgradeJob,
            LOG
        );
      }
      default -> throw new IllegalArgumentException("Unknown precheck type: " + precheckRun.getType());
    }
  }
}
