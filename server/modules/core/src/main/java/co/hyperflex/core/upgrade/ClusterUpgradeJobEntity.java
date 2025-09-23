package co.hyperflex.core.upgrade;

import co.hyperflex.core.models.enums.ClusterUpgradeStatus;
import java.util.HashMap;
import java.util.Map;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "cluster-upgrade-jobs")
public class ClusterUpgradeJobEntity {
  public static final String CLUSTER_ID = "clusterId";
  public static final String ACTIVE = "isActive";
  public static final String STOP = "stop";
  public static final String STATUS = "status";

  @Id
  private String id;
  private String clusterId;
  private String currentVersion;
  private String targetVersion;
  private boolean isActive;
  private boolean stop = false;
  private Map<String, Integer> nodeCheckPoints = new HashMap<>();
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

  public boolean isActive() {
    return isActive;
  }

  public void setActive(boolean active) {
    isActive = active;
  }

  public Map<String, Integer> getNodeCheckPoints() {
    return nodeCheckPoints;
  }

  public void setNodeCheckPoints(Map<String, Integer> nodeCheckPoints) {
    this.nodeCheckPoints = nodeCheckPoints;
  }

  public boolean isStop() {
    return stop;
  }

  public void setStop(boolean stop) {
    this.stop = stop;
  }
}
