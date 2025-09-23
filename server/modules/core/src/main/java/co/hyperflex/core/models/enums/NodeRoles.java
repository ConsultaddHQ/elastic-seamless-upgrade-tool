package co.hyperflex.core.models.enums;

public interface NodeRoles {
  String ML = "ml";
  String DATA = "data";
  String DATA_FROZEN = "data_frozen";
  String DATA_COLD = "data_cold";
  String DATA_WARM = "data_warm";
  String DATA_HOT = "data_hot";
  String DATA_CONTENT = "data_content";
  String MASTER = "master";
  String INGEST = "ingest";
  String TRANSFORM = "transform";
  String REMOTE_CLUSTER_CLIENT = "remote_cluster_client";
  String KIBANA = "kibana";
}
