package co.hyperflex.clients.elastic.dto.nodes;

import com.fasterxml.jackson.annotation.JsonProperty;

public class Jvm {
  private JvmMemoryStats mem;

  @JsonProperty("vm_name")
  private String vmName;

  @JsonProperty("vm_version")
  private String vmVersion;

  @JsonProperty("vm_vendor")
  private String vmVendor;

  @JsonProperty("bundled_jdk")
  private Boolean bundledJdk;

  @JsonProperty("using_bundled_jdk")
  private Boolean usingBundledJdk;

  public JvmMemoryStats getMem() {
    return mem;
  }

  public void setMem(JvmMemoryStats mem) {
    this.mem = mem;
  }

  public String getVmName() {
    return vmName;
  }

  public void setVmName(String vmName) {
    this.vmName = vmName;
  }

  public String getVmVersion() {
    return vmVersion;
  }

  public void setVmVersion(String vmVersion) {
    this.vmVersion = vmVersion;
  }

  public String getVmVendor() {
    return vmVendor;
  }

  public void setVmVendor(String vmVendor) {
    this.vmVendor = vmVendor;
  }

  public Boolean getBundledJdk() {
    return bundledJdk;
  }

  public void setBundledJdk(Boolean bundledJdk) {
    this.bundledJdk = bundledJdk;
  }

  public Boolean getUsingBundledJdk() {
    return usingBundledJdk;
  }

  public void setUsingBundledJdk(Boolean usingBundledJdk) {
    this.usingBundledJdk = usingBundledJdk;
  }
}
