package co.hyperflex.clients.elastic.dto.nodes;

import java.util.Map;

public class NodesInfoResponse {
  private Map<String, NodeInfo> nodes;

  public Map<String, NodeInfo> getNodes() {
    return nodes;
  }

  public void setNodes(Map<String, NodeInfo> nodes) {
    this.nodes = nodes;
  }
}
