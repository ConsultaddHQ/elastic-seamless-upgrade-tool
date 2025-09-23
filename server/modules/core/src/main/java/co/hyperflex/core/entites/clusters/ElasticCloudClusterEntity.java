package co.hyperflex.core.entites.clusters;

import co.hyperflex.core.models.enums.ClusterType;
import com.fasterxml.jackson.annotation.JsonTypeName;

@JsonTypeName("ELASTIC_CLOUD")
public class ElasticCloudClusterEntity extends ClusterEntity {
  private String deploymentId;

  public ElasticCloudClusterEntity() {
    setType(ClusterType.ELASTIC_CLOUD);
  }

  public String getDeploymentId() {
    return deploymentId;
  }

  public void setDeploymentId(String deploymentId) {
    this.deploymentId = deploymentId;
  }
}
