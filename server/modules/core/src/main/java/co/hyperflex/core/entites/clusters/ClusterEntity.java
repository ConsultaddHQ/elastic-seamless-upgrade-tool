package co.hyperflex.core.entites.clusters;

import co.hyperflex.core.models.enums.ClusterType;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "clusters")
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "type", visible = true)
@JsonSubTypes({
    @JsonSubTypes.Type(value = SelfManagedClusterEntity.class, name = "SELF_MANAGED"),
    @JsonSubTypes.Type(value = ElasticCloudClusterEntity.class, name = "ELASTIC_CLOUD")
})
public abstract class ClusterEntity {

  @Id
  private String id;
  private String name;
  private String elasticUrl;
  private String kibanaUrl;

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

  public ClusterType getType() {
    return type;
  }

  public void setType(ClusterType type) {
    this.type = type;
  }
}
