package co.hyperflex.core.services.secret;

import co.hyperflex.core.exceptions.NotFoundException;
import co.hyperflex.core.services.ConfigurationService;
import co.hyperflex.core.utils.SecretUtil;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.KeyStore;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
class P12SecretStoreService implements SecretStoreService {

  private static final String KEYSTORE_TYPE = "PKCS12";
  private static final String SECRET_STORE_ENCRYPTION_KEY = "app.security.encryption.key";

  private final Path keystorePath;
  private final char[] keystorePassword;

  private final Map<String, Secret> cache = new HashMap<>();
  private final Object lock = new Object();

  public P12SecretStoreService(
      @Value("${seamless.output.dir}") String outputDir,
      ConfigurationService configurationService) {
    try {
      Path outputDirPath = Path.of(outputDir);
      Files.createDirectories(outputDirPath);
      this.keystorePath = outputDirPath.resolve("credentials.p12");
      String ksPass = configurationService.<String>getOrInitialize(
          SECRET_STORE_ENCRYPTION_KEY,
          () -> SecretUtil.generateSecret(10)
      );
      this.keystorePassword = ksPass.toCharArray();

      // Create empty P12 if it does not exist
      if (!Files.exists(keystorePath)) {
        KeyStore ks = KeyStore.getInstance(KEYSTORE_TYPE);
        ks.load(null, this.keystorePassword);
        try (FileOutputStream fos = new FileOutputStream(keystorePath.toFile())) {
          ks.store(fos, this.keystorePassword);
        }
      }

      loadCacheFromFile();
    } catch (Exception e) {
      throw new RuntimeException("Failed to initialize PKCS#12 secret store", e);
    }
  }

  private void loadCacheFromFile() {
    synchronized (lock) {
      try {
        KeyStore ks = KeyStore.getInstance(KEYSTORE_TYPE);
        try (FileInputStream fis = new FileInputStream(keystorePath.toFile())) {
          ks.load(fis, keystorePassword);
        }

        cache.clear();
        for (String alias : Collections.list(ks.aliases())) {
          KeyStore.SecretKeyEntry entry = (KeyStore.SecretKeyEntry) ks.getEntry(
              alias, new KeyStore.PasswordProtection(keystorePassword)
          );
          String value = new String(entry.getSecretKey().getEncoded());
          cache.put(alias, new Secret(value));
        }
      } catch (Exception e) {
        throw new RuntimeException("Failed to load secrets from keystore", e);
      }
    }
  }

  private void persistCacheToFile() {
    synchronized (lock) {
      try {
        KeyStore ks = KeyStore.getInstance(KEYSTORE_TYPE);
        if (Files.exists(keystorePath)) {
          try (FileInputStream fis = new FileInputStream(keystorePath.toFile())) {
            ks.load(fis, keystorePassword);
          }
        } else {
          ks.load(null, keystorePassword);
        }

        for (Map.Entry<String, Secret> entry : cache.entrySet()) {
          KeyStore.SecretKeyEntry skEntry = new KeyStore.SecretKeyEntry(
              new SecretKeySpec(entry.getValue().value().getBytes(), "AES")
          );
          ks.setEntry(entry.getKey(), skEntry, new KeyStore.PasswordProtection(keystorePassword));
        }

        try (FileOutputStream fos = new FileOutputStream(keystorePath.toFile())) {
          ks.store(fos, keystorePassword);
        }
      } catch (Exception e) {
        throw new RuntimeException("Failed to persist secrets to keystore", e);
      }
    }
  }

  @Override
  public Secret getSecret(String key) {
    synchronized (lock) {
      return Optional.ofNullable(cache.get(key)).orElseThrow(() -> new NotFoundException("Secret not found: " + key));
    }
  }

  @Override
  public void putSecret(String key, Secret secret) {
    synchronized (lock) {
      cache.put(key, secret);
      persistCacheToFile();
    }
  }

  @Override
  public void removeSecret(String key) {
    synchronized (lock) {
      cache.remove(key);
      persistCacheToFile();
    }
  }

  @Override
  public boolean exists(String key) {
    synchronized (lock) {
      return cache.containsKey(key);
    }
  }
}
