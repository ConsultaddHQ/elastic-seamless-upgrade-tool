package co.hyperflex.core.services.clusters.dtos;

import co.hyperflex.core.models.enums.ClusterType;
import jakarta.validation.constraints.NotNull;

public class UpdateElasticCloudClusterRequest extends UpdateClusterRequest {

  @NotNull
  private String deploymentId;

  public UpdateElasticCloudClusterRequest() {
    setType(ClusterType.ELASTIC_CLOUD);
  }

  public String getDeploymentId() {
    return deploymentId;
  }

  public void setDeploymentId(String deploymentId) {
    this.deploymentId = deploymentId;
  }

}
