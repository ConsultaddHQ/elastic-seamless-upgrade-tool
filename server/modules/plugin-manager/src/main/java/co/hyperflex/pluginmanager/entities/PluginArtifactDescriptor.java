package co.hyperflex.pluginmanager.entities;

import java.util.Map;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "plugin-sources")
public class PluginArtifactDescriptor {
  public static final String PLUGIN_NAME = "name";

  @Id
  private String id;
  private String name;
  private boolean isOfficial;
  private String sourcePattern;
  private Map<String, String> versionSources = Map.of();


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

  public String getSourcePattern() {
    return sourcePattern;
  }

  public void setSourcePattern(String sourcePattern) {
    this.sourcePattern = sourcePattern;
  }

  public boolean isOfficial() {
    return isOfficial;
  }

  public void setOfficial(boolean official) {
    isOfficial = official;
  }

  public Map<String, String> getVersionSources() {
    return versionSources;
  }

  public void setVersionSources(Map<String, String> versionSources) {
    this.versionSources = versionSources;
  }
}
