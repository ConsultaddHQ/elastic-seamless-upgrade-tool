package co.hyperflex.core.services.clusters;

import co.hyperflex.clients.elastic.ElasticClient;
import co.hyperflex.clients.elastic.ElasticsearchClientProvider;
import co.hyperflex.clients.elastic.dto.GetAllocationExplanationResponse;
import co.hyperflex.clients.elastic.dto.cat.master.MasterRecord;
import co.hyperflex.clients.elastic.dto.info.InfoResponse;
import co.hyperflex.clients.kibana.KibanaClient;
import co.hyperflex.clients.kibana.KibanaClientProvider;
import co.hyperflex.clients.kibana.dto.GetKibanaStatusResponse;
import co.hyperflex.clients.kibana.dto.OsStats;
import co.hyperflex.common.exceptions.BadRequestException;
import co.hyperflex.common.exceptions.NotFoundException;
import co.hyperflex.common.utils.HashUtil;
import co.hyperflex.common.utils.UrlUtils;
import co.hyperflex.core.entites.clusters.ClusterEntity;
import co.hyperflex.core.entites.clusters.ElasticCloudClusterEntity;
import co.hyperflex.core.entites.clusters.SelfManagedClusterEntity;
import co.hyperflex.core.entites.clusters.nodes.ClusterNodeEntity;
import co.hyperflex.core.entites.clusters.nodes.ElasticNodeEntity;
import co.hyperflex.core.entites.clusters.nodes.KibanaNodeEntity;
import co.hyperflex.core.mappers.ClusterMapper;
import co.hyperflex.core.models.clusters.Distro;
import co.hyperflex.core.models.clusters.OperatingSystemInfo;
import co.hyperflex.core.models.clusters.SshInfo;
import co.hyperflex.core.models.enums.ClusterNodeType;
import co.hyperflex.core.models.enums.NodeUpgradeStatus;
import co.hyperflex.core.models.enums.PackageManager;
import co.hyperflex.core.repositories.ClusterNodeRepository;
import co.hyperflex.core.repositories.ClusterRepository;
import co.hyperflex.core.services.clusters.dtos.AddClusterRequest;
import co.hyperflex.core.services.clusters.dtos.AddClusterResponse;
import co.hyperflex.core.services.clusters.dtos.AddSelfManagedClusterRequest;
import co.hyperflex.core.services.clusters.dtos.ClusterListItemResponse;
import co.hyperflex.core.services.clusters.dtos.ClusterOverviewResponse;
import co.hyperflex.core.services.clusters.dtos.GetClusterKibanaNodeResponse;
import co.hyperflex.core.services.clusters.dtos.GetClusterNodeResponse;
import co.hyperflex.core.services.clusters.dtos.GetClusterResponse;
import co.hyperflex.core.services.clusters.dtos.UpdateClusterRequest;
import co.hyperflex.core.services.clusters.dtos.UpdateClusterResponse;
import co.hyperflex.core.services.clusters.dtos.UpdateElasticCloudClusterRequest;
import co.hyperflex.core.services.clusters.dtos.UpdateSelfManagedClusterRequest;
import co.hyperflex.core.services.ssh.SshKeyService;
import co.hyperflex.core.utils.ClusterAuthUtils;
import co.hyperflex.core.utils.NodeRoleRankerUtils;
import jakarta.validation.constraints.NotNull;
import java.io.IOException;
import java.util.Comparator;
import java.util.LinkedList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;

@Service
public class ClusterServiceImpl implements ClusterService {
  private static final Logger log = LoggerFactory.getLogger(ClusterServiceImpl.class);
  private final ClusterRepository clusterRepository;
  private final ClusterNodeRepository clusterNodeRepository;
  private final ClusterMapper clusterMapper;
  private final ElasticsearchClientProvider elasticsearchClientProvider;
  private final KibanaClientProvider kibanaClientProvider;
  private final SshKeyService sshKeyService;

  public ClusterServiceImpl(ClusterRepository clusterRepository,
                            ClusterNodeRepository clusterNodeRepository,
                            ClusterMapper clusterMapper,
                            ElasticsearchClientProvider elasticsearchClientProvider,
                            KibanaClientProvider kibanaClientProvider,
                            SshKeyService sshKeyService) {
    this.clusterRepository = clusterRepository;
    this.clusterNodeRepository = clusterNodeRepository;
    this.clusterMapper = clusterMapper;
    this.elasticsearchClientProvider = elasticsearchClientProvider;
    this.kibanaClientProvider = kibanaClientProvider;
    this.sshKeyService = sshKeyService;
  }

  @Override
  public AddClusterResponse add(final AddClusterRequest request) {
    final ClusterEntity cluster = this.clusterMapper.toEntity(request);
    validateCluster(cluster);
    clusterRepository.save(cluster);
    syncElasticNodes(cluster);
    if (request instanceof AddSelfManagedClusterRequest selfManagedRequest) {
      final List<KibanaNodeEntity> clusterNodes = selfManagedRequest.getKibanaNodes().stream().map(kibanaNodeRequest -> {
        KibanaNodeEntity node = clusterMapper.toNodeEntity(kibanaNodeRequest);
        node.setId(HashUtil.generateHash(cluster.getId() + ":" + node.getIp()));
        node.setClusterId(cluster.getId());
        return node;
      }).toList();
      syncKibanaNodes((SelfManagedClusterEntity) cluster, clusterNodes);
      clusterNodeRepository.saveAll(clusterNodes);
    }

    return new AddClusterResponse(cluster.getId());
  }

  @CacheEvict(value = "elasticClientCache", key = "#p0")
  @Override
  public UpdateClusterResponse updateCluster(String clusterId, UpdateClusterRequest request) {
    ClusterEntity cluster = clusterRepository.findById(clusterId)
        .orElseThrow(() -> new NotFoundException("Cluster not found with id: " + clusterId));

    cluster.setName(request.getName());
    cluster.setElasticUrl(request.getElasticUrl());
    cluster.setKibanaUrl(request.getKibanaUrl());
    cluster.setUsername(request.getUsername());
    cluster.setApiKey(request.getApiKey());
    cluster.setPassword(request.getPassword());

    validateCluster(cluster);


    if (request instanceof UpdateSelfManagedClusterRequest selfManagedRequest
        && cluster instanceof SelfManagedClusterEntity selfManagedCluster) {
      String file = sshKeyService.createSSHPrivateKeyFile(selfManagedRequest.getSshKey(), selfManagedCluster.getId());
      selfManagedCluster.setSshInfo(new SshInfo(selfManagedRequest.getSshUsername(), selfManagedRequest.getSshKey(), file, "root"));

      if (selfManagedRequest.getKibanaNodes() != null && !selfManagedRequest.getKibanaNodes().isEmpty()) {
        final List<KibanaNodeEntity> clusterNodes = selfManagedRequest.getKibanaNodes().stream().map(kibanaNodeRequest -> {
          KibanaNodeEntity node = clusterMapper.toNodeEntity(kibanaNodeRequest);
          node.setClusterId(cluster.getId());
          node.setId(HashUtil.generateHash(cluster.getId() + ":" + node.getIp()));
          return node;
        }).toList();
        syncKibanaNodes(selfManagedCluster, clusterNodes);
        clusterNodeRepository.saveAll(clusterNodes);
      }

    } else if (request instanceof UpdateElasticCloudClusterRequest elasticCloudRequest
        && cluster instanceof ElasticCloudClusterEntity elasticCloudCluster) {
      elasticCloudCluster.setDeploymentId(elasticCloudRequest.getDeploymentId());
    } else {
      throw new BadRequestException("Invalid request");
    }

    clusterRepository.save(cluster);
    syncElasticNodes(cluster);
    return new UpdateClusterResponse();
  }

  @Override
  public GetClusterResponse getClusterById(String clusterId) {
    Optional<ClusterEntity> optionalCluster = clusterRepository.findById(clusterId);
    if (optionalCluster.isPresent()) {
      ClusterEntity cluster = optionalCluster.get();
      List<ClusterNodeEntity> nodes = clusterNodeRepository.findByClusterId(clusterId);
      List<GetClusterKibanaNodeResponse> kibanaNodes = nodes.stream().filter(node -> node.getType() == ClusterNodeType.KIBANA)
          .map(node -> new GetClusterKibanaNodeResponse(node.getId(), node.getName(), node.getIp())).toList();
      return clusterMapper.toGetClusterResponse(cluster, kibanaNodes);
    }
    throw new NotFoundException("Cluster not found with id: " + clusterId);
  }

  @Override
  public List<GetClusterNodeResponse> getNodes(String clusterId) {
    return this.getNodes(clusterId, null);
  }

  @Override
  public List<GetClusterNodeResponse> getNodes(String clusterId, ClusterNodeType type) {
    List<ClusterNodeEntity> clusterNodes;

    if (type == null) {
      clusterNodes = clusterNodeRepository.findByClusterId(clusterId);
    } else {
      clusterNodes = clusterNodeRepository.findByClusterIdAndType(clusterId, type);
    }

    int minNonUpgradedNodeRank =
        clusterNodes.stream().filter(node -> node.getStatus() != NodeUpgradeStatus.UPGRADED).mapToInt(ClusterNodeEntity::getRank).min()
            .orElse(Integer.MAX_VALUE);

    boolean isUpgrading = clusterNodes.stream().anyMatch(node -> node.getStatus() == NodeUpgradeStatus.UPGRADING);

    return clusterNodes.stream().peek(node -> node.setUpgradable(
            node.getStatus() != NodeUpgradeStatus.UPGRADED && !isUpgrading && node.getRank() <= minNonUpgradedNodeRank))
        .sorted(Comparator.comparingInt(ClusterNodeEntity::getRank)).map(clusterMapper::toGetClusterNodeResponse).toList();
  }

  @Override
  public List<ClusterListItemResponse> getClusters() {
    return clusterRepository.findAll().stream().map(cluster -> {
      String version = "N/A";
      String status = null;
      try {
        ElasticClient client = elasticsearchClientProvider.getClient(cluster.getId());
        version = client.getInfo().getVersion().getNumber();
        status = client.getHealthStatus();
      } catch (Exception e) {
        log.error("Error getting cluster list from Elasticsearch:", e);
      }
      return new ClusterListItemResponse(cluster.getId(), cluster.getName(), cluster.getType().name(), cluster.getType().getDisplayName(),
          version, status);
    }).toList();
  }

  @Override
  public ClusterOverviewResponse getClusterOverview(String clusterId) {
    ClusterEntity cluster = clusterRepository.getCluster(clusterId);
    ElasticClient elasticClient = elasticsearchClientProvider.getClient(cluster.getId());

    try {
      InfoResponse info = elasticClient.getInfo();
      var indicesCount = elasticClient.getIndices().size();
      var activeMasters = elasticClient.getActiveMasters();
      Boolean adaptiveReplicaEnabled = elasticClient.isAdaptiveReplicaEnabled();
      String healthStatus = elasticClient.getHealthStatus();
      var counts = elasticClient.getEntitiesCounts();
      return new ClusterOverviewResponse(info.getClusterName(), info.getClusterUuid(), healthStatus, info.getVersion().getNumber(), false,
          counts.dataNodes(), counts.totalNodes(), activeMasters.size(),
          activeMasters.stream().map(MasterRecord::getId).collect(Collectors.joining(",")), adaptiveReplicaEnabled, indicesCount,
          counts.activePrimaryShards(), counts.activeShards(), counts.unassignedShards(), counts.initializingShards(),
          counts.relocatingShards(), cluster.getType().getDisplayName());
    } catch (IOException e) {
      log.error("Failed to get cluster overview for clusterId: {}", clusterId, e);
      throw new RuntimeException(e);
    }
  }

  @Override
  public boolean isNodesUpgraded(String clusterId, ClusterNodeType clusterNodeType) {
    return getNodes(clusterId, clusterNodeType).stream().map(GetClusterNodeResponse::status)
        .noneMatch(status -> NodeUpgradeStatus.UPGRADED != status);
  }

  @Override
  public void syncClusterState(String clusterId) {
    try {
      ClusterEntity cluster = clusterRepository.findById(clusterId).orElseThrow();
      syncElasticNodes(cluster);
      if (cluster instanceof SelfManagedClusterEntity selfManagedCluster) {
        syncKibanaNodes(selfManagedCluster);
      }
    } catch (Exception e) {
      log.error("Failed to sync cluster state for clusterId: {}", clusterId, e);
    }
  }

  @Override
  public void resetUpgradeStatus(@NotNull String clusterId) {
    List<ClusterNodeEntity> clusterNodes = clusterNodeRepository.findByClusterId(clusterId);
    clusterNodes.forEach(node -> {
      node.setStatus(NodeUpgradeStatus.AVAILABLE);
      node.setProgress(0);
    });
    clusterNodeRepository.saveAll(clusterNodes);
  }

  private void syncKibanaNodes(SelfManagedClusterEntity cluster, List<KibanaNodeEntity> nodes) {
    var kibanaClient = kibanaClientProvider.getClient(ClusterAuthUtils.getKibanaConnectionDetail(cluster));
    nodes.forEach(node -> {
      GetKibanaStatusResponse details = kibanaClient.getKibanaNodeDetails(node.getIp());
      OsStats os = details.metrics().os();
      node.setVersion(details.version().number());
      if (node.getOs() == null || node.getOs().packageManager() == null || node.getOs().distro() == null) {
        var distro = new Distro(os.distro(), os.distroRelease());
        node.setOs(new OperatingSystemInfo(os.platform(), os.platformRelease(), distro, PackageManager.APT));
      }
    });
  }

  private void syncKibanaNodes(SelfManagedClusterEntity cluster) {
    List<KibanaNodeEntity> clusterNodes = clusterNodeRepository
        .findByClusterIdAndType(cluster.getId(), ClusterNodeType.KIBANA)
        .stream()
        .map(node -> (KibanaNodeEntity) node)
        .toList();
    syncKibanaNodes(cluster, clusterNodes);
    clusterNodeRepository.saveAll(clusterNodes);
  }

  private void syncElasticNodes(ClusterEntity cluster) {
    try {
      ElasticClient elasticClient = elasticsearchClientProvider.getClient(ClusterAuthUtils.getElasticConnectionDetail(cluster));
      var response = elasticClient.getNodesInfo();
      var nodes = response.getNodes();
      List<ClusterNodeEntity> clusterNodes = new LinkedList<>();

      List<MasterRecord> activeMasters = elasticClient.getActiveMasters();

      for (var entry : nodes.entrySet()) {
        String nodeId = entry.getKey();
        var value = entry.getValue();

        ElasticNodeEntity node = new ElasticNodeEntity();
        node.setId(nodeId);
        node.setClusterId(cluster.getId());
        node.setIp(value.getIp());
        node.setName(value.getName());
        node.setVersion(value.getVersion());
        node.setRoles(value.getRoles().stream().map(Enum::name).map(String::toLowerCase).toList());

        // Extract OS info
        if (value.getOs() != null) {
          var os = value.getOs();
          var pm = PackageManager.fromBuildType(entry.getValue().getBuildType());
          var distro = new Distro(os.getPrettyName(), os.getPrettyName());
          node.setOs(new OperatingSystemInfo(os.getName(), os.getVersion(), distro, pm));
        }

        node.setProgress(0);
        boolean isActiveMaster = activeMasters.stream().anyMatch(masterNode -> nodeId.equals(masterNode.getId()));
        node.setMaster(isActiveMaster);
        node.setStatus(NodeUpgradeStatus.AVAILABLE);
        node.setType(ClusterNodeType.ELASTIC);
        node.setRank(NodeRoleRankerUtils.getNodeRankByRoles(node.getRoles(), isActiveMaster));

        // Sync with DB
        Optional<ClusterNodeEntity> existingNodeOpt = clusterNodeRepository.findById(nodeId);
        existingNodeOpt.ifPresent(existing -> {
          node.setStatus(existing.getStatus());
          node.setProgress(existing.getProgress());
        });

        clusterNodes.add(node);
      }

      clusterNodeRepository.saveAll(clusterNodes);
    } catch (Exception e) {
      log.error("Error syncing nodes from Elasticsearch:", e);
      throw new RuntimeException(e);
    }
  }

  private void validateCluster(ClusterEntity cluster) {
    cluster.setKibanaUrl(UrlUtils.validateAndCleanUrl(cluster.getKibanaUrl()));
    cluster.setElasticUrl(UrlUtils.validateAndCleanUrl(cluster.getElasticUrl()));
    try {
      ElasticClient elasticClient = elasticsearchClientProvider.getClient(ClusterAuthUtils.getElasticConnectionDetail(cluster));
      elasticClient.getHealthStatus();
    } catch (Exception e) {
      log.warn("Error validating cluster credentials", e);
      throw new BadRequestException("Elastic credentials are invalid");
    }

    try {
      KibanaClient kibanaClient = kibanaClientProvider.getClient(ClusterAuthUtils.getKibanaConnectionDetail(cluster));
      kibanaClient.getKibanaVersion();
    } catch (Exception e) {
      log.warn("Error validating cluster credentials", e);
      throw new BadRequestException("Kibana credentials are invalid");
    }
  }

  @Override
  public List<GetAllocationExplanationResponse> getAllocationExplanation(String clusterId) {
    return elasticsearchClientProvider.getClient(clusterId).getAllocationExplanation();
  }

}