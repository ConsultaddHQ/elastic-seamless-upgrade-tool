package co.hyperflex.core.models.enums;

public enum ClusterType {
  ELASTIC_CLOUD,
  SELF_MANAGED;

  public String getDisplayName() {
    return switch (this) {
      case ELASTIC_CLOUD -> "Elastic Cloud";
      case SELF_MANAGED -> "On-Prem/ Self managed Cluster";
      default -> "UNKNOWN";
    };
  }
}
