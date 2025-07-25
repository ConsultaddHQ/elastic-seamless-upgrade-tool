package co.hyperflex.entities.precheck;

import java.time.Instant;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "precheck-groups")
public class PrecheckGroup {

  @Id
  private String id;

  private String clusterUpgradeJobId;

  private String clusterId;

  private PrecheckStatus status = PrecheckStatus.PENDING;

  @CreatedDate
  private Instant createdAt;

  @LastModifiedDate
  private Instant updatedAt;

  // Constructors
  public PrecheckGroup() {
  }

  public PrecheckGroup(String id, String clusterUpgradeJobId, PrecheckStatus status) {
    this.id = id;
    this.clusterUpgradeJobId = clusterUpgradeJobId;
    this.status = status;
  }

  public String getClusterId() {
    return clusterId;
  }

  public void setClusterId(String clusterId) {
    this.clusterId = clusterId;
  }

  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public String getClusterUpgradeJobId() {
    return clusterUpgradeJobId;
  }

  public void setClusterUpgradeJobId(String clusterUpgradeJobId) {
    this.clusterUpgradeJobId = clusterUpgradeJobId;
  }

  public PrecheckStatus getStatus() {
    return status;
  }

  public void setStatus(PrecheckStatus status) {
    this.status = status;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }
}
