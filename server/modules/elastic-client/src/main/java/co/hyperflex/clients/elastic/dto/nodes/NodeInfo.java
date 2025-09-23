package co.hyperflex.clients.elastic.dto.nodes;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.annotation.Nullable;
import java.util.List;
import java.util.Map;

public class NodeInfo {
  private Map<String, String> attributes;

  @JsonProperty("build_flavor")
  private String buildFlavor;
  private NodeOperatingSystemInfo os;

  private List<NodeRole> roles;

  @JsonProperty("build_hash")
  private String buildHash;

  @JsonProperty("build_type")
  private String buildType;

  private String host;
  private List<PluginStats> plugins;
  private String ip;

  private String name;

  @Nullable
  @JsonProperty("total_indexing_buffer")
  private Long totalIndexingBuffer;

  @Nullable
  @JsonProperty("total_indexing_buffer_in_bytes")
  private String totalIndexingBufferInBytes;

  @JsonProperty("transport_address")
  private String transportAddress;

  private String version;

  public Map<String, String> getAttributes() {
    return attributes;
  }

  public void setAttributes(Map<String, String> attributes) {
    this.attributes = attributes;
  }

  public String getBuildFlavor() {
    return buildFlavor;
  }

  public void setBuildFlavor(String buildFlavor) {
    this.buildFlavor = buildFlavor;
  }

  public String getBuildHash() {
    return buildHash;
  }

  public void setBuildHash(String buildHash) {
    this.buildHash = buildHash;
  }

  public String getBuildType() {
    return buildType;
  }

  public void setBuildType(String buildType) {
    this.buildType = buildType;
  }

  public String getHost() {
    return host;
  }

  public void setHost(String host) {
    this.host = host;
  }

  public String getIp() {
    return ip;
  }

  public void setIp(String ip) {
    this.ip = ip;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  @Nullable
  public Long getTotalIndexingBuffer() {
    return totalIndexingBuffer;
  }

  public void setTotalIndexingBuffer(@Nullable Long totalIndexingBuffer) {
    this.totalIndexingBuffer = totalIndexingBuffer;
  }

  @Nullable
  public String getTotalIndexingBufferInBytes() {
    return totalIndexingBufferInBytes;
  }

  public void setTotalIndexingBufferInBytes(@Nullable String totalIndexingBufferInBytes) {
    this.totalIndexingBufferInBytes = totalIndexingBufferInBytes;
  }

  public String getTransportAddress() {
    return transportAddress;
  }

  public void setTransportAddress(String transportAddress) {
    this.transportAddress = transportAddress;
  }

  public String getVersion() {
    return version;
  }

  public void setVersion(String version) {
    this.version = version;
  }

  public List<PluginStats> getPlugins() {
    return plugins;
  }

  public void setPlugins(List<PluginStats> plugins) {
    this.plugins = plugins;
  }

  public List<NodeRole> getRoles() {
    return roles;
  }

  public void setRoles(List<NodeRole> roles) {
    this.roles = roles;
  }

  public NodeOperatingSystemInfo getOs() {
    return os;
  }

  public void setOs(NodeOperatingSystemInfo os) {
    this.os = os;
  }
}
