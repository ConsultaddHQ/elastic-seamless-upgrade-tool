package co.hyperflex.precheck.entities;

import co.hyperflex.precheck.core.enums.PrecheckType;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "prechecks")
public class NodePrecheckRunEntity extends PrecheckRunEntity {
  private NodeInfo node;

  public NodePrecheckRunEntity() {
    setType(PrecheckType.NODE);
  }

  public NodeInfo getNode() {
    return node;
  }

  public void setNode(NodeInfo node) {
    this.node = node;
  }

  public record NodeInfo(String id, String name, String ip, int rank) {
  }
}