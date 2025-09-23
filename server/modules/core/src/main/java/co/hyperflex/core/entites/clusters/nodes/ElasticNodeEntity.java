package co.hyperflex.core.entites.clusters.nodes;


import co.hyperflex.core.models.enums.ClusterNodeType;
import com.fasterxml.jackson.annotation.JsonTypeName;

@JsonTypeName("ELASTIC")
public class ElasticNodeEntity extends ClusterNodeEntity {
  private boolean isMaster;

  public ElasticNodeEntity() {
    setType(ClusterNodeType.ELASTIC);
  }

  public boolean isMaster() {
    return isMaster;
  }

  public void setMaster(boolean master) {
    isMaster = master;
  }
}