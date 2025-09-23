package co.hyperflex.clients.elastic.dto.nodes;

import java.util.Map;

public class NodesStatsResponse {

  private Map<String, Stats> nodes;

  public Map<String, Stats> getNodes() {
    return nodes;
  }

  public void setNodes(Map<String, Stats> nodes) {
    this.nodes = nodes;
  }
}
