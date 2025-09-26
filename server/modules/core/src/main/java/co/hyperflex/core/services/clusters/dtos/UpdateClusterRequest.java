package co.hyperflex.core.services.clusters.dtos;

import co.hyperflex.core.models.enums.ClusterType;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import jakarta.validation.constraints.NotNull;

@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "type", visible = true)
@JsonSubTypes({
    @JsonSubTypes.Type(value = UpdateSelfManagedClusterRequest.class, name = "SELF_MANAGED"),
    @JsonSubTypes.Type(value = UpdateElasticCloudClusterRequest.class, name = "ELASTIC_CLOUD")
})
public abstract class UpdateClusterRequest {

  @NotNull
  private String name;

  @NotNull
  private ClusterType type;

  @NotNull
  private String elasticUrl;

  @NotNull
  private String kibanaUrl;

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