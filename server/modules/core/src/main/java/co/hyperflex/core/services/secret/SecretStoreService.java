package co.hyperflex.core.services.secret;

public interface SecretStoreService {
  Secret getSecret(String key);

  void putSecret(String key, Secret secret);

  void removeSecret(String key);

  boolean exists(String key);

}
