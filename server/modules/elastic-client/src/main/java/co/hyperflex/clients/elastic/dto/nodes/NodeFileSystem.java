package co.hyperflex.clients.elastic.dto.nodes;

import com.fasterxml.jackson.annotation.JsonProperty;

public class NodeFileSystem {
  @JsonProperty("total")
  private ExtendedMemoryStats mem;

  public ExtendedMemoryStats getMem() {
    return mem;
  }

  public void setMem(ExtendedMemoryStats mem) {
    this.mem = mem;
  }
}
