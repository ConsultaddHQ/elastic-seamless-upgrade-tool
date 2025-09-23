package co.hyperflex.core.mappers;

import co.hyperflex.core.entites.clusters.ClusterEntity;
import co.hyperflex.core.entites.clusters.ElasticCloudClusterEntity;
import co.hyperflex.core.entites.clusters.SelfManagedClusterEntity;
import co.hyperflex.core.entites.clusters.nodes.ClusterNodeEntity;
import co.hyperflex.core.entites.clusters.nodes.ElasticNodeEntity;
import co.hyperflex.core.entites.clusters.nodes.KibanaNodeEntity;
import co.hyperflex.core.models.clusters.SshInfo;
import co.hyperflex.core.models.enums.ClusterNodeType;
import co.hyperflex.core.services.clusters.dtos.AddClusterKibanaNodeRequest;
import co.hyperflex.core.services.clusters.dtos.AddClusterRequest;
import co.hyperflex.core.services.clusters.dtos.AddElasticCloudClusterRequest;
import co.hyperflex.core.services.clusters.dtos.AddSelfManagedClusterRequest;
import co.hyperflex.core.services.clusters.dtos.GetClusterKibanaNodeResponse;
import co.hyperflex.core.services.clusters.dtos.GetClusterNodeResponse;
import co.hyperflex.core.services.clusters.dtos.GetClusterResponse;
import co.hyperflex.core.services.clusters.dtos.GetElasticCloudClusterResponse;
import co.hyperflex.core.services.clusters.dtos.GetSelfManagedClusterResponse;
import co.hyperflex.core.services.ssh.SshKeyService;
import co.hyperflex.core.utils.NodeRoleRankerUtils;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Component;

@Component
public class ClusterMapper {

  private final SshKeyService sshKeyService;

  public ClusterMapper(SshKeyService sshKeyService) {
    this.sshKeyService = sshKeyService;
  }

  public ClusterEntity toEntity(AddClusterRequest request) {
    final ClusterEntity cluster = switch (request) {
      case AddSelfManagedClusterRequest selfManagedRequest -> {
        SelfManagedClusterEntity selfManagedCluster = new SelfManagedClusterEntity();
        String file =
            sshKeyService.createSSHPrivateKeyFile(selfManagedRequest.getSshKey(), UUID.randomUUID().toString());
        selfManagedCluster.setSshInfo(new SshInfo(
            selfManagedRequest.getSshUsername(),
            selfManagedRequest.getSshKey(), file, "root"));
        yield selfManagedCluster;
      }
      case AddElasticCloudClusterRequest elasticCloudRequest -> {
        ElasticCloudClusterEntity elasticCloudCluster = new ElasticCloudClusterEntity();
        elasticCloudCluster.setDeploymentId(elasticCloudRequest.getDeploymentId());
        yield elasticCloudCluster;
      }
      default -> throw new IllegalArgumentException("Invalid request");
    };
    cluster.setName(request.getName());
    cluster.setElasticUrl(request.getElasticUrl());
    cluster.setKibanaUrl(request.getKibanaUrl());
    cluster.setUsername(request.getUsername());
    cluster.setPassword(request.getPassword());
    cluster.setApiKey(request.getApiKey());

    return cluster;
  }

  public KibanaNodeEntity toNodeEntity(AddClusterKibanaNodeRequest request) {
    KibanaNodeEntity node = new KibanaNodeEntity();
    node.setName(request.name());
    node.setIp(request.ip());
    node.setRoles(List.of("kibana"));
    node.setType(ClusterNodeType.KIBANA);
    node.setRank(NodeRoleRankerUtils.getNodeRankByRoles(node.getRoles(), false));
    return node;
  }

  public GetClusterResponse toGetClusterResponse(ClusterEntity cluster,
                                                 List<GetClusterKibanaNodeResponse> kibanaNodes) {
    GetClusterResponse response = switch (cluster) {
      case SelfManagedClusterEntity selfManagedCluster -> {
        GetSelfManagedClusterResponse selfManagedClusterResponse =
            new GetSelfManagedClusterResponse();
        selfManagedClusterResponse.setKibanaNodes(kibanaNodes);
        selfManagedClusterResponse.setSshKey(selfManagedCluster.getSshInfo().key());
        selfManagedClusterResponse.setSshUsername(selfManagedCluster.getSshInfo().username());
        yield selfManagedClusterResponse;
      }
      case ElasticCloudClusterEntity elasticCloudCluster -> {
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

  public GetClusterNodeResponse toGetClusterNodeResponse(ClusterNodeEntity node) {
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
        node instanceof ElasticNodeEntity elasticNode && elasticNode.isMaster(),
        node.isUpgradable(),
        node.getRank()
    );
  }

}
