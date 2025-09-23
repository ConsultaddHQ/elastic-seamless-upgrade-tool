package co.hyperflex.clients.elastic.dto.cluster;

public class ClusterStatsResponse {
  private ClusterNodes nodes;

  public ClusterNodes getNodes() {
    return nodes;
  }

  public void setNodes(ClusterNodes nodes) {
    this.nodes = nodes;
  }
}
