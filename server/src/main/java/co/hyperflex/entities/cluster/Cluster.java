package co.hyperflex.entities.cluster;

import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "clusters")
public class Cluster {

  private String id;
  private String name;
  private String elasticUrl;
  private String kibanaUrl;
  private String username;
  private String password;
  private ClusterType clusterType;

  public ClusterType getClusterType() {
    return clusterType;
  }

  public void setClusterType(ClusterType clusterType) {
    this.clusterType = clusterType;
  }

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

}
