package co.hyperflex.core.services.clusters.dtos;

import jakarta.annotation.Nullable;


public class UpdateClusterCredentialRequest {

  @Nullable
  private String username;
  @Nullable
  private String password;
  @Nullable
  private String apiKey;

  @Nullable
  public String getUsername() {
    return username;
  }

  public void setUsername(@Nullable String username) {
    this.username = username;
  }

  @Nullable
  public String getPassword() {
    return password;
  }

  public void setPassword(@Nullable String password) {
    this.password = password;
  }

  @Nullable
  public String getApiKey() {
    return apiKey;
  }

  public void setApiKey(@Nullable String apiKey) {
    this.apiKey = apiKey;
  }
}