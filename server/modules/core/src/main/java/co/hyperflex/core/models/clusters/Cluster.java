package co.hyperflex.core.models.clusters;

import co.hyperflex.core.models.enums.ClusterType;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;

@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "type", visible = true)
@JsonSubTypes({
    @JsonSubTypes.Type(value = SelfManagedCluster.class, name = "SELF_MANAGED"),
    @JsonSubTypes.Type(value = ElasticCloudCluster.class, name = "ELASTIC_CLOUD")
})
public abstract class Cluster {

  private String id;
  private String name;
  private String elasticUrl;
  private String kibanaUrl;
  private String username;
  private String password;
  private String apiKey;

  private ClusterType type;

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

  public String getUsername() {
    return username;
  }

  public void setUsername(String username) {
    this.username = username;
  }

  public String getPassword() {
    return password;
  }

  public void setPassword(String password) {
    this.password = password;
  }

  public ClusterType getType() {
    return type;
  }

  public void setType(ClusterType type) {
    this.type = type;
  }

  public String getApiKey() {
    return apiKey;
  }

  public void setApiKey(String apiKey) {
    this.apiKey = apiKey;
  }
}
