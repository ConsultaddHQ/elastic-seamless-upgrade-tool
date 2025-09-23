package co.hyperflex.core.services.clusters.dtos;

import co.hyperflex.core.models.enums.ClusterType;
import jakarta.validation.constraints.NotNull;
import java.util.Collections;
import java.util.List;

public class AddSelfManagedClusterRequest extends AddClusterRequest {

  @NotNull
  private List<AddClusterKibanaNodeRequest> kibanaNodes = Collections.emptyList();

  @NotNull
  private String sshUsername;
  @NotNull
  private String sshKey;

  public AddSelfManagedClusterRequest() {
    setType(ClusterType.SELF_MANAGED);
  }

  public List<AddClusterKibanaNodeRequest> getKibanaNodes() {
    return kibanaNodes;
  }

  public void setKibanaNodes(List<AddClusterKibanaNodeRequest> kibanaNodes) {
    this.kibanaNodes = kibanaNodes;
  }

  public String getSshKey() {
    return sshKey;
  }

  public void setSshKey(String sshKey) {
    this.sshKey = sshKey;
  }

  public String getSshUsername() {
    return sshUsername;
  }

  public void setSshUsername(String sshUsername) {
    this.sshUsername = sshUsername;
  }
}
