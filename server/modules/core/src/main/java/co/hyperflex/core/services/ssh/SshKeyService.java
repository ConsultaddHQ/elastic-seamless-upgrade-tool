package co.hyperflex.core.services.ssh;

import jakarta.annotation.PostConstruct;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class SshKeyService {

  private static final Logger logger = LoggerFactory.getLogger(SshKeyService.class);
  private final String ansiblePlaybooksPath;

  private Path sshKeysDir;

  public SshKeyService(@Value("${seamless.output.dir}") String ansiblePlaybooksPath) {
    this.ansiblePlaybooksPath = ansiblePlaybooksPath;
  }

  @PostConstruct
  public void init() {
    this.sshKeysDir = Paths.get(ansiblePlaybooksPath, "ssh-keys");
    try {
      Files.createDirectories(sshKeysDir);
      logger.info("SSH key directory initialized at {}", sshKeysDir.toAbsolutePath());
    } catch (IOException e) {
      logger.error("Failed to create SSH keys directory: {}", sshKeysDir, e);
      throw new IllegalStateException("Failed to create SSH keys directory: " + sshKeysDir, e);
    }
  }

  public String createSSHPrivateKeyFile(String privateKey, String fileName) {
    if (privateKey == null || privateKey.trim().isEmpty()) {
      throw new IllegalArgumentException("Invalid SSH key: Key must be a non-empty string.");
    }

    Path keyPath = sshKeysDir.resolve(fileName);

    try (FileWriter writer = new FileWriter(keyPath.toFile())) {
      writer.write(privateKey);
      logger.info("SSH private key written to {}", keyPath.toAbsolutePath());
    } catch (IOException e) {
      logger.error("Failed to write SSH private key to file: {}", keyPath, e);
      throw new RuntimeException("Failed to write SSH private key to file: " + keyPath, e);
    }

    setFilePermissions(keyPath);
    return keyPath.toAbsolutePath().toString();
  }

  public boolean sshFileExists(String fileName) {
    if (fileName == null || fileName.isBlank()) {
      return false;
    }
    Path keyPath = sshKeysDir.resolve(fileName);
    boolean exists = Files.exists(keyPath);
    logger.debug("Checked existence of SSH key file '{}': {}", fileName, exists);
    return exists;
  }

  private void setFilePermissions(Path path) {
    File file = path.toFile();
    boolean readable = file.setReadable(false, false) && file.setReadable(true, true);
    boolean writable = file.setWritable(false, false) && file.setWritable(true, true);
    boolean executable = file.setExecutable(false, false);

    logger.debug("Set permissions for {}: readable={}, writable={}, executable={}",
        path.toAbsolutePath(), readable, writable, executable);
  }
}
