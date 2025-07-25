package co.hyperflex.prechecks.scheduler;

import co.hyperflex.clients.ElasticClient;
import co.hyperflex.clients.ElasticsearchClientProvider;
import co.hyperflex.dtos.prechecks.PrecheckRerunRequest;
import co.hyperflex.dtos.prechecks.PrecheckScheduleResponse;
import co.hyperflex.entities.cluster.Cluster;
import co.hyperflex.entities.cluster.ClusterNode;
import co.hyperflex.entities.precheck.ClusterPrecheckRun;
import co.hyperflex.entities.precheck.IndexPrecheckRun;
import co.hyperflex.entities.precheck.NodePrecheckRun;
import co.hyperflex.entities.precheck.PrecheckGroup;
import co.hyperflex.exceptions.NotFoundException;
import co.hyperflex.prechecks.contexts.IndexContext;
import co.hyperflex.prechecks.contexts.NodeContext;
import co.hyperflex.prechecks.contexts.PrecheckContext;
import co.hyperflex.prechecks.contexts.resolver.PrecheckContextResolver;
import co.hyperflex.prechecks.core.BaseIndexPrecheck;
import co.hyperflex.prechecks.core.BaseNodePrecheck;
import co.hyperflex.prechecks.registry.PrecheckRegistry;
import co.hyperflex.repositories.ClusterNodeRepository;
import co.hyperflex.repositories.ClusterRepository;
import co.hyperflex.repositories.PrecheckGroupRepository;
import co.hyperflex.repositories.PrecheckRunRepository;
import co.hyperflex.services.PrecheckRunService;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class PrecheckSchedulerService {
  private final PrecheckRunRepository precheckRunRepository;
  private final ClusterRepository clusterRepository;
  private final ClusterNodeRepository clusterNodeRepository;
  private final PrecheckRegistry precheckRegistry;
  private final ElasticsearchClientProvider elasticsearchClientProvider;
  private final PrecheckGroupRepository precheckGroupRepository;
  private final PrecheckRunService precheckRunService;
  private final PrecheckContextResolver precheckContextResolver;

  public PrecheckSchedulerService(PrecheckRunRepository precheckRunRepository,
                                  ClusterRepository clusterRepository,
                                  ClusterNodeRepository clusterNodeRepository,
                                  PrecheckRegistry precheckRegistry,
                                  ElasticsearchClientProvider elasticsearchClientProvider,
                                  PrecheckGroupRepository precheckGroupRepository,
                                  PrecheckRunService precheckRunService,
                                  PrecheckContextResolver precheckContextResolver) {
    this.precheckRunRepository = precheckRunRepository;
    this.clusterRepository = clusterRepository;
    this.clusterNodeRepository = clusterNodeRepository;
    this.precheckRegistry = precheckRegistry;
    this.elasticsearchClientProvider = elasticsearchClientProvider;
    this.precheckGroupRepository = precheckGroupRepository;
    this.precheckRunService = precheckRunService;
    this.precheckContextResolver = precheckContextResolver;
  }

  public PrecheckScheduleResponse schedule(String clusterId) {
    final Cluster cluster = clusterRepository.findById(clusterId)
        .orElseThrow(() -> new NotFoundException("Cluster not found"));

    final PrecheckGroup precheckGroup = new PrecheckGroup();
    precheckGroup.setClusterId(clusterId);

    precheckGroupRepository.save(precheckGroup);

    scheduleNodePrechecks(precheckGroup, cluster);
    scheduleClusterPrechecks(precheckGroup, cluster);
    scheduleIndexPrechecks(precheckGroup, cluster);

    return new PrecheckScheduleResponse(precheckGroup.getId());
  }

  public void scheduleNodePrechecks(PrecheckGroup precheckGroup, Cluster cluster) {
    final List<ClusterNode> nodes = clusterNodeRepository.findByClusterId(cluster.getId());
    final List<NodePrecheckRun> precheckRuns =
        precheckRegistry.getNodePrechecks()
            .stream()
            .parallel()
            .flatMap(precheck -> nodes.stream().map(node -> {
              NodePrecheckRun precheckRun = new NodePrecheckRun();
              precheckRun.setPrecheckId(precheck.getId());
              precheckRun.setNode(
                  new NodePrecheckRun.NodeInfo(node.getId(), node.getName(), node.getIp())
              );
              precheckRun.setPrecheckGroupId(precheckGroup.getId());
              precheckRun.setSeverity(precheck.getSeverity());
              precheckRun.setClusterId(cluster.getId());
              precheckRun.setName(precheck.getName());
              return precheckRun;
            }).filter(precheckRun -> {
              PrecheckContext context = precheckContextResolver.resolveContext(precheckRun);
              return ((BaseNodePrecheck) precheck).shouldRun((NodeContext) context);
            }))
            .toList();

    precheckRunRepository.saveAll(precheckRuns);

  }

  public void scheduleClusterPrechecks(PrecheckGroup precheckGroup, Cluster cluster) {
    final List<ClusterPrecheckRun> precheckRuns =
        precheckRegistry.getClusterPrechecks().stream().parallel().map(precheck -> {
          ClusterPrecheckRun precheckRun = new ClusterPrecheckRun();
          precheckRun.setPrecheckId(precheck.getId());
          precheckRun.setPrecheckGroupId(precheckGroup.getId());
          precheckRun.setSeverity(precheck.getSeverity());
          precheckRun.setClusterId(cluster.getId());
          precheckRun.setName(precheck.getName());
          return precheckRun;
        }).toList();

    precheckRunRepository.saveAll(precheckRuns);

  }

  public void scheduleIndexPrechecks(PrecheckGroup precheckGroup, Cluster cluster) {
    ElasticClient elasticClient =
        elasticsearchClientProvider.getElasticsearchClientByClusterId(cluster.getId());
    final List<String> indexes = elasticClient.getIndices();
    final List<IndexPrecheckRun> precheckRuns =
        precheckRegistry.getIndexPrechecks()
            .stream()
            .parallel()
            .flatMap(precheck -> indexes
                .stream()
                .map(index -> {
                  IndexPrecheckRun precheckRun = new IndexPrecheckRun();
                  precheckRun.setIndex(new IndexPrecheckRun.IndexInfo(index));
                  precheckRun.setPrecheckId(precheck.getId());
                  precheckRun.setPrecheckGroupId(precheckGroup.getId());
                  precheckRun.setSeverity(precheck.getSeverity());
                  precheckRun.setName(precheck.getName());
                  precheckRun.setClusterId(cluster.getId());
                  return precheckRun;
                }).filter(precheckRun -> {
                  PrecheckContext context = precheckContextResolver.resolveContext(precheckRun);
                  return ((BaseIndexPrecheck) precheck).shouldRun((IndexContext) context);
                })).toList();
    precheckRunRepository.saveAll(precheckRuns);
  }

  public PrecheckScheduleResponse rerunPrechecks(String precheckGroupId,
                                                 PrecheckRerunRequest request) {
    precheckRunService.rerunPrechecks(precheckGroupId, request);
    return new PrecheckScheduleResponse(precheckGroupId);
  }
}
