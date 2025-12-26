package co.hyperflex.precheck.entities;

import co.hyperflex.precheck.core.enums.PrecheckSeverity;
import co.hyperflex.precheck.core.enums.PrecheckStatus;
import co.hyperflex.precheck.core.enums.PrecheckType;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import java.util.Date;
import java.util.List;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * Base Precheck class with polymorphic serialization.
 */
@Document(collection = "precheck-runs")
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME,
    include = JsonTypeInfo.As.EXISTING_PROPERTY,
    property = "type",
    visible = true
)
@JsonSubTypes({@JsonSubTypes.Type(value = ClusterPrecheckRunEntity.class, name = "CLUSTER"),
    @JsonSubTypes.Type(value = NodePrecheckRunEntity.class, name = "NODE"),
    @JsonSubTypes.Type(value = IndexPrecheckRunEntity.class, name = "INDEX")})
public abstract class PrecheckRunEntity {

  public static final String STATUS = "status";
  public static final String CLUSTER_UPGRADE_JOB_ID = "clusterUpgradeJobId";
  public static final String SEVERITY = "severity";
  public static final String LOGS = "logs";
  public static final String START_TIME = "startTime";
  public static final String END_TIME = "endTime";
  public static final String TYPE = "type";

  @Id
  private String id;

  private String precheckId;

  private String clusterId;

  private String name;

  private PrecheckType type;

  private PrecheckSeverity severity = PrecheckSeverity.WARNING;

  private String clusterUpgradeJobId;

  private PrecheckStatus status = PrecheckStatus.PENDING;

  private List<String> logs = List.of();

  private Date startTime;

  private Date endTime;
  private boolean skippable;

  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public PrecheckType getType() {
    return type;
  }

  public void setType(PrecheckType type) {
    this.type = type;
  }

  public PrecheckSeverity getSeverity() {
    return severity;
  }

  public void setSeverity(PrecheckSeverity severity) {
    this.severity = severity;
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

  public List<String> getLogs() {
    return logs;
  }

  public void setLogs(List<String> logs) {
    this.logs = logs;
  }

  public Date getStartTime() {
    return startTime;
  }

  public void setStartTime(Date startTime) {
    this.startTime = startTime;
  }

  public Date getEndTime() {
    return endTime;
  }

  public void setEndTime(Date endTime) {
    this.endTime = endTime;
  }

  public String getPrecheckId() {
    return precheckId;
  }

  public void setPrecheckId(String precheckId) {
    this.precheckId = precheckId;
  }

  public String getClusterId() {
    return clusterId;
  }

  public void setClusterId(String clusterId) {
    this.clusterId = clusterId;
  }

  public void setSkippable(boolean skippable) {
    this.skippable = skippable;
  }

  public boolean isSkippable() {
    return skippable;
  }
}

