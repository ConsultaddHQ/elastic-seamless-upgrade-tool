package co.hyperflex.precheck.services;

import co.hyperflex.clients.elastic.ElasticClient;
import co.hyperflex.clients.elastic.ElasticsearchClientProvider;
import co.hyperflex.clients.elastic.dto.cat.indices.IndicesRecord;
import co.hyperflex.common.utils.HashUtil;
import co.hyperflex.core.services.clusters.ClusterService;
import co.hyperflex.core.services.clusters.dtos.GetClusterNodeResponse;
import co.hyperflex.core.services.notifications.NotificationService;
import co.hyperflex.core.services.notifications.UpgradeJobCreatedEvent;
import co.hyperflex.core.services.upgrade.ClusterUpgradeJobService;
import co.hyperflex.core.upgrade.ClusterUpgradeJobEntity;
import co.hyperflex.precheck.contexts.IndexContext;
import co.hyperflex.precheck.contexts.NodeContext;
import co.hyperflex.precheck.contexts.PrecheckContext;
import co.hyperflex.precheck.contexts.resolver.PrecheckContextResolver;
import co.hyperflex.precheck.core.BaseIndexPrecheck;
import co.hyperflex.precheck.core.BaseNodePrecheck;
import co.hyperflex.precheck.entities.ClusterPrecheckRunEntity;
import co.hyperflex.precheck.entities.IndexPrecheckRunEntity;
import co.hyperflex.precheck.entities.NodePrecheckRunEntity;
import co.hyperflex.precheck.registry.PrecheckRegistry;
import co.hyperflex.precheck.repositories.PrecheckRunRepository;
import co.hyperflex.precheck.services.dtos.PrecheckRerunRequest;
import co.hyperflex.precheck.services.dtos.PrecheckScheduleResponse;
import jakarta.annotation.PostConstruct;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class PrecheckSchedulerService {
  private final PrecheckRunRepository precheckRunRepository;
  private final ClusterService clusterService;
  private final ClusterUpgradeJobService clusterUpgradeJobService;
  private final PrecheckRegistry precheckRegistry;
  private final ElasticsearchClientProvider elasticsearchClientProvider;
  private final PrecheckRunService precheckRunService;
  private final PrecheckContextResolver precheckContextResolver;
  private final NotificationService notificationService;

  public PrecheckSchedulerService(PrecheckRunRepository precheckRunRepository,
                                  ClusterService clusterService,
                                  ClusterUpgradeJobService clusterUpgradeJobService,
                                  PrecheckRegistry precheckRegistry,
                                  ElasticsearchClientProvider elasticsearchClientProvider,
                                  PrecheckRunService precheckRunService,
                                  PrecheckContextResolver precheckContextResolver, NotificationService notificationService) {
    this.precheckRunRepository = precheckRunRepository;
    this.clusterService = clusterService;
    this.clusterUpgradeJobService = clusterUpgradeJobService;
    this.precheckRegistry = precheckRegistry;
    this.elasticsearchClientProvider = elasticsearchClientProvider;
    this.precheckRunService = precheckRunService;
    this.precheckContextResolver = precheckContextResolver;
    this.notificationService = notificationService;
  }

  public PrecheckScheduleResponse schedule(String clusterId) {
    final ClusterUpgradeJobEntity clusterUpgradeJob = clusterUpgradeJobService.getActiveJobByClusterId(clusterId);
    final String upgradeJobId = clusterUpgradeJob.getId();
    scheduleNodePrechecks(upgradeJobId, clusterId);
    scheduleClusterPrechecks(upgradeJobId, clusterId);
    scheduleIndexPrechecks(upgradeJobId, clusterId);
    return new PrecheckScheduleResponse(upgradeJobId);
  }

  public void scheduleNodePrechecks(String upgradeJobId, String clusterId) {
    List<GetClusterNodeResponse> nodes = clusterService.getNodes(clusterId);
    precheckRegistry.getNodePrechecks()
        .stream()
        .parallel()
        .flatMap(precheck -> nodes.stream().map(node -> {
          NodePrecheckRunEntity precheckRun = new NodePrecheckRunEntity();
          precheckRun.setId(HashUtil.generateHash(precheck.getId() + ":" + upgradeJobId + ":" + node.id()));
          precheckRun.setPrecheckId(precheck.getId());
          precheckRun.setNode(
              new NodePrecheckRunEntity.NodeInfo(node.id(), node.name(), node.ip(), node.rank())
          );
          precheckRun.setClusterUpgradeJobId(upgradeJobId);
          precheckRun.setSeverity(precheck.getSeverity());
          precheckRun.setClusterId(clusterId);
          precheckRun.setName(precheck.getName());
          return precheckRun;
        }).filter(precheckRun -> {
          PrecheckContext context = precheckContextResolver.resolveContext(precheckRun);
          return ((BaseNodePrecheck) precheck).shouldRun((NodeContext) context);
        }))
        .forEach(precheckRunRepository::save);
  }

  public void scheduleClusterPrechecks(String upgradeJobId, String clusterId) {
    precheckRegistry.getClusterPrechecks().stream().parallel().map(precheck -> {
      ClusterPrecheckRunEntity precheckRun = new ClusterPrecheckRunEntity();
      precheckRun.setId(HashUtil.generateHash(precheck.getId() + ":" + upgradeJobId));
      precheckRun.setPrecheckId(precheck.getId());
      precheckRun.setClusterUpgradeJobId(upgradeJobId);
      precheckRun.setSeverity(precheck.getSeverity());
      precheckRun.setClusterId(clusterId);
      precheckRun.setName(precheck.getName());
      return precheckRun;
    }).forEach(precheckRunRepository::save);
  }

  public void scheduleIndexPrechecks(String upgradeJobId, String clusterId) {
    ElasticClient elasticClient =
        elasticsearchClientProvider.getClient(clusterId);
    final List<IndicesRecord> indexes = elasticClient.getIndices();
    precheckRegistry.getIndexPrechecks()
        .stream()
        .parallel()
        .flatMap(precheck -> indexes
            .stream()
            .map(index -> {
              IndexPrecheckRunEntity precheckRun = new IndexPrecheckRunEntity();
              precheckRun.setId(HashUtil.generateHash(precheck.getId() + ":" + upgradeJobId + ":" + index));
              precheckRun.setIndex(new IndexPrecheckRunEntity.IndexInfo(index.getIndex()));
              precheckRun.setPrecheckId(precheck.getId());
              precheckRun.setClusterUpgradeJobId(upgradeJobId);
              precheckRun.setSeverity(precheck.getSeverity());
              precheckRun.setName(precheck.getName());
              precheckRun.setClusterId(clusterId);
              return precheckRun;
            }).filter(precheckRun -> {
              PrecheckContext context = precheckContextResolver.resolveContext(precheckRun);
              return ((BaseIndexPrecheck) precheck).shouldRun((IndexContext) context);
            })).forEach(precheckRunRepository::save);
  }

  public PrecheckScheduleResponse rerunPrechecks(String clusterId,
                                                 PrecheckRerunRequest request) {
    ClusterUpgradeJobEntity upgradeJob = clusterUpgradeJobService.getActiveJobByClusterId(clusterId);
    precheckRunService.rerunPrechecks(upgradeJob.getId(), request);
    return new PrecheckScheduleResponse(upgradeJob.getId());
  }

  @PostConstruct
  public void postConstruct() {
    notificationService.addNotificationListener(notification -> {
      if (notification instanceof UpgradeJobCreatedEvent event) {
        boolean precheckExists = precheckRunService.precheckExistsForJob(event.getUpgradeJobId());
        if (!precheckExists) {
          schedule(event.getClusterId());
        }
      }
    });
  }
}
