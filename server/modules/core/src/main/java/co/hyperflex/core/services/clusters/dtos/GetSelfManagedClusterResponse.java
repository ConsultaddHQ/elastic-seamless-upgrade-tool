package co.hyperflex.core.services.clusters.dtos;

import co.hyperflex.core.models.enums.ClusterType;
import java.util.List;

public class GetSelfManagedClusterResponse extends GetClusterResponse {
  private List<GetClusterKibanaNodeResponse> kibanaNodes;
  private String sshKey;
  private String sshUsername;

  public GetSelfManagedClusterResponse() {
    setType(ClusterType.SELF_MANAGED);
  }

  public List<GetClusterKibanaNodeResponse> getKibanaNodes() {
    return kibanaNodes;
  }

  public void setKibanaNodes(List<GetClusterKibanaNodeResponse> kibanaNodes) {
    this.kibanaNodes = kibanaNodes;
  }

  public String getSshUsername() {
    return sshUsername;
  }

  public void setSshUsername(String sshUsername) {
    this.sshUsername = sshUsername;
  }

  public String getSshKey() {
    return sshKey;
  }

  public void setSshKey(String sshKey) {
    this.sshKey = sshKey;
  }
}
