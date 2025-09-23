package co.hyperflex.core.services.upgrade.dtos;

public class ClusterUpgradeRequest {
  private String clusterId;
  private String nodeId;
  private boolean retry = false;
  private int retryFromTaskSeq = 0;

  public String getClusterId() {
    return clusterId;
  }

  public void setClusterId(String clusterId) {
    this.clusterId = clusterId;
  }

  public String getNodeId() {
    return nodeId;
  }

  public void setNodeId(String nodeId) {
    this.nodeId = nodeId;
  }

  public boolean isRetry() {
    return retry;
  }

  public void setRetry(boolean retry) {
    this.retry = retry;
  }

  public int getRetryFromTaskSeq() {
    return retryFromTaskSeq;
  }

  public void setRetryFromTaskSeq(int retryFromTaskSeq) {
    this.retryFromTaskSeq = retryFromTaskSeq;
  }
}