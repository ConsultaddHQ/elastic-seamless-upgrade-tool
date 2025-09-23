package co.hyperflex.core.services.clusters.dtos;

import co.hyperflex.core.models.enums.ClusterType;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import jakarta.annotation.Nullable;
import jakarta.validation.constraints.NotNull;

@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "type", visible = true)
@JsonSubTypes({
    @JsonSubTypes.Type(value = AddSelfManagedClusterRequest.class, name = "SELF_MANAGED"),
    @JsonSubTypes.Type(value = AddElasticCloudClusterRequest.class, name = "ELASTIC_CLOUD")
})
public abstract class AddClusterRequest {

  @NotNull
  private String name;

  @NotNull
  private ClusterType type;

  @NotNull
  private String elasticUrl;

  @NotNull
  private String kibanaUrl;

  @Nullable
  private String username;

  @Nullable
  private String password;

  @Nullable
  private String apiKey;

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

  @Nullable
  public String getUsername() {
    return username;
  }

  public void setUsername(@Nullable String username) {
    this.username = username;
  }

  @Nullable
  public String getPassword() {
    return password;
  }

  public void setPassword(@Nullable String password) {
    this.password = password;
  }

  @Nullable
  public String getApiKey() {
    return apiKey;
  }

  public void setApiKey(@Nullable String apiKey) {
    this.apiKey = apiKey;
  }
}