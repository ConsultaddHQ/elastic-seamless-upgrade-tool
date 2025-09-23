package co.hyperflex.clients.elastic.dto.info;

import com.fasterxml.jackson.annotation.JsonProperty;

public class InfoResponse {
  private ElasticsearchVersionInfo version;
  @JsonProperty("cluster_name")
  private String clusterName;
  @JsonProperty("cluster_uuid")
  private String clusterUuid;

  public ElasticsearchVersionInfo getVersion() {
    return version;
  }

  public void setVersion(ElasticsearchVersionInfo version) {
    this.version = version;
  }

  public String getClusterName() {
    return clusterName;
  }

  public void setClusterName(String clusterName) {
    this.clusterName = clusterName;
  }

  public String getClusterUuid() {
    return clusterUuid;
  }

  public void setClusterUuid(String clusterUuid) {
    this.clusterUuid = clusterUuid;
  }
}
