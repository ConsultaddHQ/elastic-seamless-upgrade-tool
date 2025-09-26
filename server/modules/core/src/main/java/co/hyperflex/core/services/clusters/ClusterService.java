package co.hyperflex.core.services.clusters;

import co.hyperflex.clients.elastic.dto.GetAllocationExplanationResponse;
import co.hyperflex.core.models.enums.ClusterNodeType;
import co.hyperflex.core.services.clusters.dtos.AddClusterRequest;
import co.hyperflex.core.services.clusters.dtos.AddClusterResponse;
import co.hyperflex.core.services.clusters.dtos.ClusterListItemResponse;
import co.hyperflex.core.services.clusters.dtos.ClusterOverviewResponse;
import co.hyperflex.core.services.clusters.dtos.GetClusterNodeResponse;
import co.hyperflex.core.services.clusters.dtos.GetClusterResponse;
import co.hyperflex.core.services.clusters.dtos.UpdateClusterCredentialRequest;
import co.hyperflex.core.services.clusters.dtos.UpdateClusterCredentialResponse;
import co.hyperflex.core.services.clusters.dtos.UpdateClusterRequest;
import co.hyperflex.core.services.clusters.dtos.UpdateClusterResponse;
import co.hyperflex.core.services.clusters.dtos.UpdateClusterSshDetailRequest;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public interface ClusterService {
  AddClusterResponse add(AddClusterRequest request);

  UpdateClusterResponse updateCluster(String clusterId, UpdateClusterRequest request);

  UpdateClusterResponse updateClusterSshDetail(String clusterId, UpdateClusterSshDetailRequest request);

  UpdateClusterCredentialResponse updateClusterCredential(String clusterId, UpdateClusterCredentialRequest request);

  GetClusterResponse getClusterById(String clusterId);

  List<GetClusterNodeResponse> getNodes(String clusterId);

  List<GetClusterNodeResponse> getNodes(String clusterId, ClusterNodeType type);

  List<ClusterListItemResponse> getClusters();

  ClusterOverviewResponse getClusterOverview(String clusterId);

  boolean isNodesUpgraded(String clusterId, ClusterNodeType clusterNodeType);

  void syncClusterState(String clusterId);

  void resetUpgradeStatus(@NotNull String clusterId);

  List<GetAllocationExplanationResponse> getAllocationExplanation(String clusterId);
}
