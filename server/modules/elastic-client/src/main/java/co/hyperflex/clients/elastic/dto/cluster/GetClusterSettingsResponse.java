package co.hyperflex.clients.elastic.dto.cluster;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.HashMap;
import java.util.Map;

public class GetClusterSettingsResponse {
  private Map<String, Object> persistent = new HashMap<>();
  @JsonProperty("transient")
  private Map<String, Object> transientSetting = new HashMap<>();
  private Map<String, Object> defaults = new HashMap<>();

  public Map<String, Object> getPersistent() {
    return persistent;
  }

  public void setPersistent(Map<String, Object> persistent) {
    this.persistent = persistent;
  }

  public Map<String, Object> getTransient() {
    return transientSetting;
  }

  public void setTransient(Map<String, Object> transientSetting) {
    this.transientSetting = transientSetting;
  }

  public Map<String, Object> getDefaults() {
    return defaults;
  }

  public void setDefaults(Map<String, Object> defaults) {
    this.defaults = defaults;
  }
}
