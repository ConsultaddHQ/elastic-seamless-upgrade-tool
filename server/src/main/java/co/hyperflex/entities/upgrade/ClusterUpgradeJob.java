package co.hyperflex.entities.upgrade;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "cluster-upgrade-jobs")
public class ClusterUpgradeJob {

  @Id
  private String id;
  private String clusterId;
  private String currentVersion;
  private String targetVersion;
  private ClusterUpgradeStatus status = ClusterUpgradeStatus.PENDING;


  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public String getClusterId() {
    return clusterId;
  }

  public void setClusterId(String clusterId) {
    this.clusterId = clusterId;
  }

  public String getCurrentVersion() {
    return currentVersion;
  }

  public void setCurrentVersion(String currentVersion) {
    this.currentVersion = currentVersion;
  }

  public String getTargetVersion() {
    return targetVersion;
  }

  public void setTargetVersion(String targetVersion) {
    this.targetVersion = targetVersion;
  }

  public ClusterUpgradeStatus getStatus() {
    return status;
  }

  public void setStatus(ClusterUpgradeStatus status) {
    this.status = status;
  }
}
