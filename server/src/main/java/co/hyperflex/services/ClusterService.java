package co.hyperflex.services;

import co.hyperflex.dtos.clusters.AddClusterRequest;
import co.hyperflex.dtos.clusters.AddClusterResponse;
import co.hyperflex.dtos.clusters.AddSelfManagedClusterRequest;
import co.hyperflex.dtos.clusters.GetClusterKibanaNodeResponse;
import co.hyperflex.dtos.clusters.GetClusterNodeResponse;
import co.hyperflex.dtos.clusters.GetClusterResponse;
import co.hyperflex.dtos.clusters.UpdateClusterRequest;
import co.hyperflex.dtos.clusters.UpdateClusterResponse;
import co.hyperflex.entities.cluster.Cluster;
import co.hyperflex.entities.cluster.ClusterNode;
import co.hyperflex.entities.cluster.ClusterNodeType;
import co.hyperflex.mappers.ClusterMapper;
import co.hyperflex.repositories.ClusterNodeRepository;
import co.hyperflex.repositories.ClusterRepository;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;

@Service
public class ClusterService {
  private final ClusterRepository clusterRepository;
  private final ClusterNodeRepository clusterNodeRepository;
  private final ClusterMapper clusterMapper;

  public ClusterService(ClusterRepository clusterRepository,
                        ClusterNodeRepository clusterNodeRepository, ClusterMapper clusterMapper) {
    this.clusterRepository = clusterRepository;
    this.clusterNodeRepository = clusterNodeRepository;
    this.clusterMapper = clusterMapper;
  }

  public AddClusterResponse add(final AddClusterRequest request) {
    final Cluster cluster = this.clusterMapper.toEntity(request);

    clusterRepository.save(cluster);

    if (request instanceof AddSelfManagedClusterRequest selfManagedRequest) {
      final List<ClusterNode> clusterNodes = selfManagedRequest.getKibanaNodes()
          .stream()
          .map(kibanaNodeRequest -> {
            ClusterNode node = clusterMapper.toNodeEntity(kibanaNodeRequest);
            node.setClusterId(cluster.getId());
            return node;
          }).toList();

      clusterNodeRepository.saveAll(clusterNodes);
    }

    return new AddClusterResponse(cluster.getId());
  }

  public GetClusterResponse getClusterById(String clusterId) {
    Optional<Cluster> optionalCluster = clusterRepository.findById(clusterId);
    if (optionalCluster.isPresent()) {
      Cluster cluster = optionalCluster.get();
      List<ClusterNode> nodes = clusterNodeRepository.findByClusterId(clusterId);
      List<GetClusterKibanaNodeResponse> kibanaNodes = nodes.stream()
          .filter(node -> node.getType() == ClusterNodeType.KIBANA)
          .map(node -> new GetClusterKibanaNodeResponse(node.getId(), node.getName(), node.getIp()))
          .toList();
      return clusterMapper.toGetClusterResponse(cluster, kibanaNodes);
    }
    return null;
  }

  public List<GetClusterNodeResponse> getNodes(String clusterId, ClusterNodeType type) {
    if (type == null) {
      return clusterNodeRepository.findByClusterId(clusterId).stream()
          .map(clusterMapper::toGetClusterNodeResponse).toList();
    }
    return clusterNodeRepository.findByClusterIdAndType(clusterId, type).stream()
        .map(clusterMapper::toGetClusterNodeResponse).toList();
  }

  public UpdateClusterResponse updateCluster(String clusterId,
                                             @Valid UpdateClusterRequest request) {
    return null;
  }

  public List<GetClusterResponse> getClusters() {
    return clusterRepository.findAll().stream()
        .map(cluster -> {
          List<ClusterNode> nodes = clusterNodeRepository.findByClusterId(cluster.getId());
          List<GetClusterKibanaNodeResponse> kibanaNodes = nodes.stream()
              .filter(node -> node.getType() == ClusterNodeType.KIBANA)
              .map(node -> new GetClusterKibanaNodeResponse(node.getId(), node.getName(),
                  node.getIp()))
              .toList();
          return clusterMapper.toGetClusterResponse(cluster, kibanaNodes);
        })
        .toList();
  }
}
