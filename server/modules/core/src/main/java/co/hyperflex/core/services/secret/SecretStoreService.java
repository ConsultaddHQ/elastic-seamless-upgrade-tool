package co.hyperflex.core.services.secret;

import java.util.Optional;

public interface SecretStoreService {
  Optional<Secret> getSecret(String key);

  void putSecret(String key, Secret secret);

  void removeSecret(String key);

  boolean exists(String key);

}
