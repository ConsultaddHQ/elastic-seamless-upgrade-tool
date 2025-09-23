package co.hyperflex.core.services.clusters.dtos;

import co.hyperflex.core.models.enums.ClusterType;

public class GetElasticCloudClusterResponse extends GetClusterResponse {
  private String deploymentId;

  public GetElasticCloudClusterResponse() {
    setType(ClusterType.ELASTIC_CLOUD);
  }

  public String getDeploymentId() {
    return deploymentId;
  }

  public void setDeploymentId(String deploymentId) {
    this.deploymentId = deploymentId;
  }

}
