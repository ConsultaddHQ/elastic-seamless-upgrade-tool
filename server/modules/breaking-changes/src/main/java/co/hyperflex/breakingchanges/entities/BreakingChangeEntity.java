package co.hyperflex.breakingchanges.entities;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "breaking-changes")
public class BreakingChangeEntity {
  @Id
  private String id;

  private String title;
  private String detail;
  private String impact;
  private String url;
  private String version;
  private String category;

  public BreakingChangeEntity() {
  }

  public String getDetail() {
    return detail;
  }

  public void setDetail(String detail) {
    this.detail = detail;
  }

  public String getImpact() {
    return impact;
  }

  public void setImpact(String impact) {
    this.impact = impact;
  }

  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public String getTitle() {
    return title;
  }

  public void setTitle(String title) {
    this.title = title;
  }

  public String getUrl() {
    return url;
  }

  public void setUrl(String url) {
    this.url = url;
  }

  public String getVersion() {
    return version;
  }

  public void setVersion(String version) {
    this.version = version;
  }

  public String getCategory() {
    return category;
  }

  public void setCategory(String category) {
    this.category = category;
  }
}
