package co.hyperflex.core.entites.clusters.nodes;

import co.hyperflex.core.models.enums.ClusterNodeType;
import com.fasterxml.jackson.annotation.JsonTypeName;

@JsonTypeName("KIBANA")
public class KibanaNodeEntity extends ClusterNodeEntity {
  public KibanaNodeEntity() {
    setType(ClusterNodeType.KIBANA);
    setUpgradable(true);
  }
}