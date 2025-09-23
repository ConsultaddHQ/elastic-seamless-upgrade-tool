package co.hyperflex.core.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import co.hyperflex.core.services.ssh.SshKeyService;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class SshKeyServiceTest {

  @TempDir
  Path tempDir;
  private SshKeyService sshKeyService;

  @BeforeEach
  void setUp() throws IOException {
    Path sshKeysDir = tempDir.resolve("ssh-keys");
    Files.createDirectories(sshKeysDir);
    sshKeyService = new SshKeyService(tempDir.toString());
    sshKeyService.init();
  }

  @Test
  void createSSHPrivateKeyFile_success() throws IOException {
    // Arrange
    String privateKey = "-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----";
    String fileName = "test_key.pem";

    // Act
    String resultPath = sshKeyService.createSSHPrivateKeyFile(privateKey, fileName);

    // Assert
    assertNotNull(resultPath);
    Path expectedPath = tempDir.resolve("ssh-keys").resolve(fileName);
    assertEquals(expectedPath.toAbsolutePath().toString(), resultPath);
    assertTrue(Files.exists(expectedPath));
    assertEquals(privateKey, Files.readString(expectedPath));
  }

  @Test
  void createSSHPrivateKeyFile_nullKey_throwsException() {
    // Arrange
    String privateKey = null;
    String fileName = "test_key.pem";

    // Act & Assert
    assertThrows(IllegalArgumentException.class, () -> {
      sshKeyService.createSSHPrivateKeyFile(privateKey, fileName);
    });
  }

  @Test
  void createSSHPrivateKeyFile_emptyKey_throwsException() {
    // Arrange
    String privateKey = "";
    String fileName = "test_key.pem";

    // Act & Assert
    assertThrows(IllegalArgumentException.class, () -> {
      sshKeyService.createSSHPrivateKeyFile(privateKey, fileName);
    });
  }

  @Test
  void sshFileExists_fileExists() throws IOException {
    // Arrange
    String fileName = "existing_key.pem";
    Files.createFile(tempDir.resolve("ssh-keys").resolve(fileName));

    // Act
    boolean exists = sshKeyService.sshFileExists(fileName);

    // Assert
    assertTrue(exists);
  }

  @Test
  void sshFileExists_fileDoesNotExist() {
    // Arrange
    String fileName = "non_existing_key.pem";

    // Act
    boolean exists = sshKeyService.sshFileExists(fileName);

    // Assert
    assertFalse(exists);
  }
}