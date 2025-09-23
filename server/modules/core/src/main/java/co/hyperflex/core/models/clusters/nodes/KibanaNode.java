package co.hyperflex.core.models.clusters.nodes;

import co.hyperflex.core.models.enums.ClusterNodeType;
import com.fasterxml.jackson.annotation.JsonTypeName;

@JsonTypeName("KIBANA")
public class KibanaNode extends ClusterNode {
  public KibanaNode() {
    setType(ClusterNodeType.KIBANA);
    setUpgradable(true);
  }
}