package co.hyperflex.clients.elastic.dto.nodes;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum NodeRole {
  Master("master"),
  Data("data"),
  DataCold("data_cold"),
  DataContent("data_content"),
  DataFrozen("data_frozen"),
  DataHot("data_hot"),
  DataWarm("data_warm"),
  Client("client"),
  Ingest("ingest"),
  Ml("ml"),
  VotingOnly("voting_only"),
  Transform("transform"),
  RemoteClusterClient("remote_cluster_client"),
  CoordinatingOnly("coordinating_only");

  private final String jsonValue;

  NodeRole(String jsonValue) {
    this.jsonValue = jsonValue;
  }

  @JsonCreator
  public static NodeRole fromJson(String value) {
    for (NodeRole role : NodeRole.values()) {
      if (role.jsonValue.equals(value)) {
        return role;
      }
    }
    throw new IllegalArgumentException("Unknown NodeRole: " + value);
  }

  @JsonValue
  public String getJsonValue() {
    return this.jsonValue;
  }
}

