package co.hyperflex.core.models.clusters;

import co.hyperflex.core.models.enums.ClusterType;
import com.fasterxml.jackson.annotation.JsonTypeName;

@JsonTypeName("ELASTIC_CLOUD")
public class ElasticCloudCluster extends Cluster {
  private String deploymentId;

  public ElasticCloudCluster() {
    setType(ClusterType.ELASTIC_CLOUD);
  }

  public String getDeploymentId() {
    return deploymentId;
  }

  public void setDeploymentId(String deploymentId) {
    this.deploymentId = deploymentId;
  }
}
