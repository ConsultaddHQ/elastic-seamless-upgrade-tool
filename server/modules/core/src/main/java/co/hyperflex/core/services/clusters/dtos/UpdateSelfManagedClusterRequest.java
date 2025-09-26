package co.hyperflex.core.services.clusters.dtos;

import co.hyperflex.core.models.enums.ClusterType;
import jakarta.validation.constraints.NotNull;
import java.util.Collections;
import java.util.List;

public class UpdateSelfManagedClusterRequest extends UpdateClusterRequest {

  @NotNull
  private List<AddClusterKibanaNodeRequest> kibanaNodes = Collections.emptyList();


  public UpdateSelfManagedClusterRequest() {
    setType(ClusterType.SELF_MANAGED);
  }

  public List<AddClusterKibanaNodeRequest> getKibanaNodes() {
    return kibanaNodes;
  }

  public void setKibanaNodes(List<AddClusterKibanaNodeRequest> kibanaNodes) {
    this.kibanaNodes = kibanaNodes;
  }

}
