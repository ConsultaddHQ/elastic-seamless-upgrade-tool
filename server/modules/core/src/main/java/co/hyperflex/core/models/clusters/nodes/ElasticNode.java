package co.hyperflex.core.models.clusters.nodes;


import co.hyperflex.core.models.enums.ClusterNodeType;
import com.fasterxml.jackson.annotation.JsonTypeName;

@JsonTypeName("ELASTIC")
public class ElasticNode extends ClusterNode {
  private boolean isMaster;

  public ElasticNode() {
    setType(ClusterNodeType.ELASTIC);
  }

  public boolean isMaster() {
    return isMaster;
  }

  public void setMaster(boolean master) {
    isMaster = master;
  }
}