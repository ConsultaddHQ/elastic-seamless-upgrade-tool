package co.hyperflex.core.services.clusters.dtos;

import co.hyperflex.core.models.enums.ClusterType;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;

@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "type", visible = true)
@JsonSubTypes({
    @JsonSubTypes.Type(value = GetSelfManagedClusterResponse.class, name = "SELF_MANAGED"),
    @JsonSubTypes.Type(value = GetElasticCloudClusterResponse.class, name = "ELASTIC_CLOUD")
})
public abstract class GetClusterResponse {
  private String id;
  private String name;
  private ClusterType type;
  private String elasticUrl;
  private String kibanaUrl;

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

  public ClusterType getType() {
    return type;
  }

  public void setType(ClusterType type) {
    this.type = type;
  }

  public String getElasticUrl() {
    return elasticUrl;
  }

  public void setElasticUrl(String elasticUrl) {
    this.elasticUrl = elasticUrl;
  }

  public String getKibanaUrl() {
    return kibanaUrl;
  }

  public void setKibanaUrl(String kibanaUrl) {
    this.kibanaUrl = kibanaUrl;
  }
}