package co.hyperflex.core.services.clusters.dtos;

import jakarta.validation.constraints.NotNull;

public class UpdateClusterSshDetailRequest {

  @NotNull
  private String sshUsername;
  @NotNull
  private String sshKey;

  public String getSshKey() {
    return sshKey;
  }

  public void setSshKey(String sshKey) {
    this.sshKey = sshKey;
  }

  public String getSshUsername() {
    return sshUsername;
  }

  public void setSshUsername(String sshUsername) {
    this.sshUsername = sshUsername;
  }
}
