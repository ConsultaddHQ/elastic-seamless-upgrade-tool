package co.hyperflex.core.models.clusters.nodes;

import co.hyperflex.core.models.clusters.OperatingSystemInfo;
import co.hyperflex.core.models.enums.ClusterNodeType;
import co.hyperflex.core.models.enums.NodeUpgradeStatus;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import java.time.Instant;
import java.util.List;

@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "type", visible = true)
@JsonSubTypes({
    @JsonSubTypes.Type(value = ElasticNode.class, name = "ELASTIC"),
    @JsonSubTypes.Type(value = KibanaNode.class, name = "KIBANA")
})
public abstract class ClusterNode {

  private String id;

  private String clusterId;

  private String name;

  private String version;

  private String ip;

  private List<String> roles;

  private OperatingSystemInfo os;

  private int progress;

  private NodeUpgradeStatus status = NodeUpgradeStatus.AVAILABLE;

  private ClusterNodeType type;

  private int rank;

  private boolean upgradable = false;

  private Instant createdAt;

  private Instant updatedAt;

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

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public String getVersion() {
    return version;
  }

  public void setVersion(String version) {
    this.version = version;
  }

  public String getIp() {
    return ip;
  }

  public void setIp(String ip) {
    this.ip = ip;
  }

  public List<String> getRoles() {
    return roles;
  }

  public void setRoles(List<String> roles) {
    this.roles = roles;
  }

  public OperatingSystemInfo getOs() {
    return os;
  }

  public void setOs(OperatingSystemInfo os) {
    this.os = os;
  }

  public int getProgress() {
    return progress;
  }

  public void setProgress(int progress) {
    this.progress = progress;
  }

  public NodeUpgradeStatus getStatus() {
    return status;
  }

  public void setStatus(NodeUpgradeStatus status) {
    this.status = status;
  }

  public ClusterNodeType getType() {
    return type;
  }

  public void setType(ClusterNodeType type) {
    this.type = type;
  }

  public int getRank() {
    return rank;
  }

  public void setRank(int rank) {
    this.rank = rank;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(Instant createdAt) {
    this.createdAt = createdAt;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }

  public void setUpdatedAt(Instant updatedAt) {
    this.updatedAt = updatedAt;
  }

  public boolean isUpgradable() {
    return upgradable;
  }

  public void setUpgradable(boolean upgradable) {
    this.upgradable = upgradable;
  }
}
