package co.hyperflex.core.services.clusters.dtos;

import co.hyperflex.core.models.enums.ClusterType;
import jakarta.validation.constraints.NotNull;

public class AddElasticCloudClusterRequest extends AddClusterRequest {

  @NotNull
  private String deploymentId;

  public AddElasticCloudClusterRequest() {
    setType(ClusterType.ELASTIC_CLOUD);
  }

  public String getDeploymentId() {
    return deploymentId;
  }

  public void setDeploymentId(String deploymentId) {
    this.deploymentId = deploymentId;
  }

}
