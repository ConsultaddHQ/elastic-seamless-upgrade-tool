package co.hyperflex.mappers;

import co.hyperflex.dtos.clusters.AddClusterKibanaNodeRequest;
import co.hyperflex.dtos.clusters.AddClusterRequest;
import co.hyperflex.dtos.clusters.AddElasticCloudClusterRequest;
import co.hyperflex.dtos.clusters.AddSelfManagedClusterRequest;
import co.hyperflex.dtos.clusters.GetClusterKibanaNodeResponse;
import co.hyperflex.dtos.clusters.GetClusterNodeResponse;
import co.hyperflex.dtos.clusters.GetClusterResponse;
import co.hyperflex.dtos.clusters.GetElasticCloudClusterResponse;
import co.hyperflex.dtos.clusters.GetSelfManagedClusterResponse;
import co.hyperflex.entities.cluster.Cluster;
import co.hyperflex.entities.cluster.ClusterNode;
import co.hyperflex.entities.cluster.ClusterNodeType;
import co.hyperflex.entities.cluster.ElasticCloudCluster;
import co.hyperflex.entities.cluster.ElasticNode;
import co.hyperflex.entities.cluster.KibanaNode;
import co.hyperflex.entities.cluster.SelfManagedCluster;
import co.hyperflex.entities.cluster.SshInfo;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Component;

@Component
public class ClusterMapper {

  public Cluster toEntity(AddClusterRequest request) {
    final Cluster cluster = switch (request) {
      case AddSelfManagedClusterRequest selfManagedRequest -> {
        SelfManagedCluster selfManagedCluster = new SelfManagedCluster();
        selfManagedCluster.setSshInfo(new SshInfo(
            selfManagedRequest.getSshUsername(),
            selfManagedRequest.getSshKey()));
        yield selfManagedCluster;
      }
      case AddElasticCloudClusterRequest elasticCloudRequest -> {
        ElasticCloudCluster elasticCloudCluster = new ElasticCloudCluster();
        elasticCloudCluster.setDeploymentId(elasticCloudRequest.getDeploymentId());
        yield elasticCloudCluster;
      }
      default -> throw new IllegalArgumentException("Invalid request");
    };
    cluster.setName(request.getName());
    cluster.setElasticUrl(request.getUrl());
    cluster.setKibanaUrl(request.getKibanaUrl());
    cluster.setUsername(request.getUsername());
    cluster.setPassword(request.getPassword());
    cluster.setApiKey(request.getApiKey());

    return cluster;
  }

  public ClusterNode toNodeEntity(AddClusterKibanaNodeRequest request) {
    ClusterNode node = new KibanaNode();
    node.setId(UUID.randomUUID().toString());
    node.setName(request.name());
    node.setIp(request.ip());
    node.setVersion("7.17.0");
    node.setRoles(List.of("kibana"));
    node.setType(ClusterNodeType.KIBANA);
    return node;
  }

  public GetClusterResponse toGetClusterResponse(Cluster cluster,
                                                 List<GetClusterKibanaNodeResponse> kibanaNodes) {
    GetClusterResponse response = switch (cluster) {
      case SelfManagedCluster selfManagedCluster -> {
        GetSelfManagedClusterResponse selfManagedClusterResponse =
            new GetSelfManagedClusterResponse();
        selfManagedClusterResponse.setKibanaNodes(kibanaNodes);
        yield selfManagedClusterResponse;
      }
      case ElasticCloudCluster elasticCloudCluster -> {
        GetElasticCloudClusterResponse elasticCloudClusterResponse =
            new GetElasticCloudClusterResponse();
        elasticCloudClusterResponse.setDeploymentId(elasticCloudCluster.getDeploymentId());
        yield elasticCloudClusterResponse;
      }
      default -> throw new IllegalArgumentException("Invalid cluster");
    };

    response.setId(cluster.getId());
    response.setName(cluster.getName());
    response.setElasticUrl(cluster.getElasticUrl());
    response.setKibanaUrl(cluster.getKibanaUrl());
    response.setUsername(cluster.getUsername());
    response.setPassword(cluster.getPassword());
    response.setApiKey(cluster.getApiKey());

    return response;
  }

  public GetClusterNodeResponse toGetClusterNodeResponse(ClusterNode node) {
    return new GetClusterNodeResponse(
        node.getId(),
        node.getName(),
        node.getIp(),
        node.getVersion(),
        node.getRoles(),
        node.getType(),
        node.getClusterId(),
        node.getProgress(),
        node.getStatus(),
        node.getOs(),
        node instanceof ElasticNode elasticNode && elasticNode.isMaster()
    );
  }

}
