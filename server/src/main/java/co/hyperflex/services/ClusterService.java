package co.hyperflex.services;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch._types.ElasticsearchException;
import co.elastic.clients.elasticsearch.cat.IndicesResponse;
import co.elastic.clients.elasticsearch.cat.health.HealthRecord;
import co.elastic.clients.elasticsearch.cat.master.MasterRecord;
import co.elastic.clients.elasticsearch.core.InfoResponse;
import co.elastic.clients.elasticsearch.nodes.NodesInfoRequest;
import co.elastic.clients.elasticsearch.nodes.NodesInfoResponse;
import co.elastic.clients.elasticsearch.nodes.info.NodeInfo;
import co.hyperflex.clients.elastic.ElasticClient;
import co.hyperflex.clients.elastic.ElasticsearchClientProvider;
import co.hyperflex.clients.kibana.KibanaClient;
import co.hyperflex.clients.kibana.KibanaClientProvider;
import co.hyperflex.clients.kibana.dto.GetKibanaStatusResponse;
import co.hyperflex.clients.kibana.dto.OsStats;
import co.hyperflex.dtos.clusters.AddClusterRequest;
import co.hyperflex.dtos.clusters.AddClusterResponse;
import co.hyperflex.dtos.clusters.AddSelfManagedClusterRequest;
import co.hyperflex.dtos.clusters.ClusterListItemResponse;
import co.hyperflex.dtos.clusters.ClusterOverviewResponse;
import co.hyperflex.dtos.clusters.GetClusterKibanaNodeResponse;
import co.hyperflex.dtos.clusters.GetClusterNodeResponse;
import co.hyperflex.dtos.clusters.GetClusterResponse;
import co.hyperflex.dtos.clusters.UpdateClusterRequest;
import co.hyperflex.dtos.clusters.UpdateClusterResponse;
import co.hyperflex.dtos.clusters.UpdateElasticCloudClusterRequest;
import co.hyperflex.dtos.clusters.UpdateSelfManagedClusterRequest;
import co.hyperflex.entities.cluster.Cluster;
import co.hyperflex.entities.cluster.ClusterNode;
import co.hyperflex.entities.cluster.ClusterNodeType;
import co.hyperflex.entities.cluster.ElasticCloudCluster;
import co.hyperflex.entities.cluster.ElasticNode;
import co.hyperflex.entities.cluster.KibanaNode;
import co.hyperflex.entities.cluster.OperatingSystemInfo;
import co.hyperflex.entities.cluster.SelfManagedCluster;
import co.hyperflex.entities.cluster.SshInfo;
import co.hyperflex.entities.upgrade.ClusterUpgradeJob;
import co.hyperflex.entities.upgrade.NodeUpgradeStatus;
import co.hyperflex.exceptions.BadRequestException;
import co.hyperflex.exceptions.NotFoundException;
import co.hyperflex.mappers.ClusterMapper;
import co.hyperflex.repositories.ClusterNodeRepository;
import co.hyperflex.repositories.ClusterRepository;
import co.hyperflex.utils.HashUtil;
import co.hyperflex.utils.NodeRoleRankerUtils;
import co.hyperflex.utils.UpgradePathUtils;
import co.hyperflex.utils.UrlUtils;
import java.io.IOException;
import java.util.Comparator;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class ClusterService {
  private static final Logger log = LoggerFactory.getLogger(ClusterService.class);
  private final ClusterRepository clusterRepository;
  private final ClusterNodeRepository clusterNodeRepository;
  private final ClusterMapper clusterMapper;
  private final ElasticsearchClientProvider elasticsearchClientProvider;
  private final KibanaClientProvider kibanaClientProvider;
  private final ClusterUpgradeJobService clusterUpgradeJobService;
  private final SshKeyService sshKeyService;

  public ClusterService(ClusterRepository clusterRepository, ClusterNodeRepository clusterNodeRepository, ClusterMapper clusterMapper,
                        ElasticsearchClientProvider elasticsearchClientProvider, KibanaClientProvider kibanaClientProvider,
                        ClusterUpgradeJobService clusterUpgradeJobService, SshKeyService sshKeyService) {
    this.clusterRepository = clusterRepository;
    this.clusterNodeRepository = clusterNodeRepository;
    this.clusterMapper = clusterMapper;
    this.elasticsearchClientProvider = elasticsearchClientProvider;
    this.kibanaClientProvider = kibanaClientProvider;
    this.clusterUpgradeJobService = clusterUpgradeJobService;
    this.sshKeyService = sshKeyService;
  }

  public AddClusterResponse add(final AddClusterRequest request) {
    final Cluster cluster = this.clusterMapper.toEntity(request);
    validateCluster(cluster);
    clusterRepository.save(cluster);
    syncElasticNodes(cluster);
    if (request instanceof AddSelfManagedClusterRequest selfManagedRequest) {
      final List<KibanaNode> clusterNodes = selfManagedRequest.getKibanaNodes().stream().map(kibanaNodeRequest -> {
        KibanaNode node = clusterMapper.toNodeEntity(kibanaNodeRequest);
        node.setId(HashUtil.generateHash(cluster.getId() + ":" + node.getIp()));
        node.setClusterId(cluster.getId());
        return node;
      }).toList();
      addKibanaNodes((SelfManagedCluster) cluster, clusterNodes);
      clusterNodeRepository.saveAll(clusterNodes);
    }

    return new AddClusterResponse(cluster.getId());
  }

  public UpdateClusterResponse updateCluster(String clusterId, UpdateClusterRequest request) {
    Cluster cluster = clusterRepository.findById(clusterId)
        .orElseThrow(() -> new co.hyperflex.exceptions.NotFoundException("Cluster not found with id: " + clusterId));

    cluster.setName(request.getName());
    cluster.setElasticUrl(request.getElasticUrl());
    cluster.setKibanaUrl(request.getKibanaUrl());
    cluster.setUsername(request.getUsername());
    cluster.setApiKey(request.getApiKey());
    cluster.setPassword(request.getPassword());

    validateCluster(cluster);


    if (request instanceof UpdateSelfManagedClusterRequest selfManagedRequest && cluster instanceof SelfManagedCluster selfManagedCluster) {
      String file = sshKeyService.createSSHPrivateKeyFile(selfManagedRequest.getSshKey(), selfManagedCluster.getId());
      selfManagedCluster.setSshInfo(new SshInfo(selfManagedRequest.getSshUsername(), selfManagedRequest.getSshKey(), file));

      if (selfManagedRequest.getKibanaNodes() != null && !selfManagedRequest.getKibanaNodes().isEmpty()) {
        final List<KibanaNode> clusterNodes = selfManagedRequest.getKibanaNodes().stream().map(kibanaNodeRequest -> {
          KibanaNode node = clusterMapper.toNodeEntity(kibanaNodeRequest);
          node.setClusterId(cluster.getId());
          node.setId(HashUtil.generateHash(cluster.getId() + ":" + node.getIp()));
          return node;
        }).toList();
        addKibanaNodes(selfManagedCluster, clusterNodes);
        clusterNodeRepository.saveAll(clusterNodes);
      }

    } else if (request instanceof UpdateElasticCloudClusterRequest elasticCloudRequest
        && cluster instanceof ElasticCloudCluster elasticCloudCluster) {
      elasticCloudCluster.setDeploymentId(elasticCloudRequest.getDeploymentId());
    } else {
      throw new BadRequestException("Invalid request");
    }

    clusterRepository.save(cluster);
    syncElasticNodes(cluster);
    return new UpdateClusterResponse();
  }

  public GetClusterResponse getClusterById(String clusterId) {
    Optional<Cluster> optionalCluster = clusterRepository.findById(clusterId);
    if (optionalCluster.isPresent()) {
      Cluster cluster = optionalCluster.get();
      List<ClusterNode> nodes = clusterNodeRepository.findByClusterId(clusterId);
      List<GetClusterKibanaNodeResponse> kibanaNodes = nodes.stream().filter(node -> node.getType() == ClusterNodeType.KIBANA)
          .map(node -> new GetClusterKibanaNodeResponse(node.getId(), node.getName(), node.getIp())).toList();
      return clusterMapper.toGetClusterResponse(cluster, kibanaNodes);
    }
    throw new NotFoundException("Cluster not found with id: " + clusterId);
  }

  public List<GetClusterNodeResponse> getNodes(String clusterId) {
    return this.getNodes(clusterId, null);
  }

  public List<GetClusterNodeResponse> getNodes(String clusterId, ClusterNodeType type) {
    List<ClusterNode> clusterNodes;

    if (type == null) {
      clusterNodes = clusterNodeRepository.findByClusterId(clusterId);
    } else {
      clusterNodes = clusterNodeRepository.findByClusterIdAndType(clusterId, type);
    }

    int minNonUpgradedNodeRank =
        clusterNodes.stream().filter(node -> node.getStatus() != NodeUpgradeStatus.UPGRADED).mapToInt(ClusterNode::getRank).min()
            .orElse(Integer.MAX_VALUE);

    boolean isUpgrading = clusterNodes.stream().anyMatch(node -> node.getStatus() == NodeUpgradeStatus.UPGRADING);

    return clusterNodes.stream().peek(node -> node.setUpgradable(
            node.getStatus() != NodeUpgradeStatus.UPGRADED && !isUpgrading && node.getRank() <= minNonUpgradedNodeRank))
        .sorted(Comparator.comparingInt(ClusterNode::getRank)).map(clusterMapper::toGetClusterNodeResponse).toList();
  }

  public List<ClusterListItemResponse> getClusters() {
    return clusterRepository.findAll().stream().map(cluster -> {
      String version = "N/A";
      String status = null;
      try {
        ElasticClient client = elasticsearchClientProvider.getClient(cluster);
        version = client.getClusterInfo().version().number();
        status = client.getHealthStatus();
      } catch (Exception e) {
        log.error("Error getting cluster list from Elasticsearch:", e);
      }
      return new ClusterListItemResponse(cluster.getId(), cluster.getName(), cluster.getType().name(), cluster.getType().getDisplayName(),
          version, status);
    }).toList();
  }

  @Deprecated
  public List<GetClusterResponse> getClustersList() {
    return clusterRepository.findAll().stream().map(cluster -> {
      List<ClusterNode> nodes = clusterNodeRepository.findByClusterId(cluster.getId());
      List<GetClusterKibanaNodeResponse> kibanaNodes = nodes.stream().filter(node -> node.getType() == ClusterNodeType.KIBANA)
          .map(node -> new GetClusterKibanaNodeResponse(node.getId(), node.getName(), node.getIp())).toList();
      return clusterMapper.toGetClusterResponse(cluster, kibanaNodes);
    }).toList();
  }

  public ClusterOverviewResponse getClusterOverview(String clusterId) {
    Cluster cluster = clusterRepository.getCluster(clusterId);
    ElasticClient elasticClient = elasticsearchClientProvider.getClient(cluster);
    ElasticsearchClient client = elasticClient.getElasticsearchClient();
    String targetVersion = null;
    boolean upgradeJobExists = clusterUpgradeJobService.clusterUpgradeJobExists(clusterId);
    if (upgradeJobExists) {
      ClusterUpgradeJob activeJobByClusterId = clusterUpgradeJobService.getActiveJobByClusterId(clusterId);
      targetVersion = activeJobByClusterId.getTargetVersion();
    }
    try {
      InfoResponse info = client.info();
      HealthRecord health = client.cat().health().valueBody().getFirst();
      IndicesResponse indices = client.cat().indices();
      List<MasterRecord> activeMasters = elasticClient.getActiveMasters();
      Boolean adaptiveReplicaEnabled = elasticClient.isAdaptiveReplicaEnabled();
      var counts = elasticClient.getEntitiesCounts();
      return new ClusterOverviewResponse(info.clusterName(), info.clusterUuid(), health.status(), info.version().number(), false,
          counts.dataNodes(), counts.totalNodes(), activeMasters.size(),
          activeMasters.stream().map(MasterRecord::id).collect(Collectors.joining(",")), adaptiveReplicaEnabled, indices.valueBody().size(),
          counts.activePrimaryShards(), counts.activeShards(), counts.unassignedShards(), counts.initializingShards(),
          counts.relocatingShards(), cluster.getType().getDisplayName(), targetVersion,
          UpgradePathUtils.getPossibleUpgrades(info.version().number()), upgradeJobExists);

    } catch (IOException e) {
      log.error("Failed to get cluster overview for clusterId: {}", clusterId, e);
      throw new RuntimeException(e);
    }
  }

  public boolean isNodesUpgraded(String clusterId, ClusterNodeType clusterNodeType) {
    return getNodes(clusterId, clusterNodeType).stream().map(GetClusterNodeResponse::status)
        .noneMatch(status -> NodeUpgradeStatus.UPGRADED != status);
  }

  public void syncClusterState(String clusterId) {
    try {
      Cluster cluster = clusterRepository.findById(clusterId).orElseThrow();
      syncElasticNodes(cluster);
      if (cluster instanceof SelfManagedCluster selfManagedCluster) {
        syncKibanaNodes(selfManagedCluster);
      }
    } catch (Exception e) {
      log.error("Failed to sync cluster state for clusterId: {}", clusterId, e);
    }
  }

  private void addKibanaNodes(SelfManagedCluster cluster, List<KibanaNode> nodes) {
    var kibanaClient = kibanaClientProvider.getClient(cluster);
    nodes.forEach(node -> {
      GetKibanaStatusResponse details = kibanaClient.getKibanaNodeDetails(node.getIp());
      OsStats os = details.metrics().os();
      node.setVersion(details.version().number());
      node.setOs(new OperatingSystemInfo(os.platform(), os.platformRelease()));
    });
  }

  private void syncKibanaNodes(SelfManagedCluster cluster) {
    var kibanaClient = kibanaClientProvider.getClient(cluster);
    List<ClusterNode> clusterNodes =
        clusterNodeRepository.findByClusterId(cluster.getId()).stream().filter(node -> node.getType() == ClusterNodeType.KIBANA).toList();
    clusterNodes.forEach(node -> {
      GetKibanaStatusResponse details = kibanaClient.getKibanaNodeDetails(node.getIp());
      OsStats os = details.metrics().os();
      node.setVersion(details.version().number());
      node.setOs(new OperatingSystemInfo(os.platform(), os.platformRelease()));
    });
    clusterNodeRepository.saveAll(clusterNodes);
  }


  private void syncElasticNodes(Cluster cluster) {
    try {
      ElasticClient elasticClient = elasticsearchClientProvider.getClient(cluster);
      ElasticsearchClient client = elasticClient.getElasticsearchClient();
      NodesInfoRequest request = new NodesInfoRequest.Builder().build();
      NodesInfoResponse response = client.nodes().info(request);
      Map<String, NodeInfo> nodes = response.nodes();
      List<ClusterNode> clusterNodes = new LinkedList<>();

      List<MasterRecord> activeMasters = elasticClient.getActiveMasters();

      for (Map.Entry<String, NodeInfo> entry : nodes.entrySet()) {
        String nodeId = entry.getKey();
        NodeInfo value = entry.getValue();

        ElasticNode node = new ElasticNode();
        node.setId(nodeId);
        node.setClusterId(cluster.getId());
        node.setIp(value.ip());
        node.setName(value.name());
        node.setVersion(value.version());
        node.setRoles(value.roles().stream().map(Enum::name).map(String::toLowerCase).toList());

        // Extract OS info
        if (value.os() != null) {
          node.setOs(new OperatingSystemInfo(value.os().name(), value.os().version()));
        }

        node.setProgress(0);
        boolean isActiveMaster = activeMasters.stream().anyMatch(masterNode -> nodeId.equals(masterNode.id()));
        node.setMaster(isActiveMaster);
        node.setStatus(NodeUpgradeStatus.AVAILABLE);
        node.setType(ClusterNodeType.ELASTIC);
        node.setRank(NodeRoleRankerUtils.getNodeRankByRoles(node.getRoles(), isActiveMaster));

        // Sync with DB
        Optional<ClusterNode> existingNodeOpt = clusterNodeRepository.findById(nodeId);
        existingNodeOpt.ifPresent(existing -> {
          node.setStatus(existing.getStatus());
          node.setProgress(existing.getProgress());
        });

        clusterNodes.add(node);
      }

      clusterNodeRepository.saveAll(clusterNodes);

    } catch (ElasticsearchException e) {
      throw new BadRequestException("Invalid credential");
    } catch (Exception e) {
      log.error("Error syncing nodes from Elasticsearch:", e);
      throw new RuntimeException(e);
    }
  }


  private void validateCluster(Cluster cluster) {
    cluster.setKibanaUrl(UrlUtils.validateAndCleanUrl(cluster.getKibanaUrl()));
    cluster.setElasticUrl(UrlUtils.validateAndCleanUrl(cluster.getElasticUrl()));
    try {
      ElasticClient elasticClient = elasticsearchClientProvider.getClient(cluster);
      elasticClient.getHealthStatus();
    } catch (Exception e) {
      log.warn("Error validating cluster credentials", e);
      throw new BadRequestException("Elastic credentials are invalid");
    }

    try {
      KibanaClient kibanaClient = kibanaClientProvider.getClient(cluster);
      kibanaClient.getKibanaVersion();
    } catch (Exception e) {
      log.warn("Error validating cluster credentials", e);
      throw new BadRequestException("Kibana credentials are invalid");
    }
  }
}