package co.hyperflex.ssh;


import co.hyperflex.ssh.utils.TestKeyUtils;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.KeyPair;
import org.apache.sshd.server.SshServer;
import org.apache.sshd.server.auth.pubkey.AcceptAllPublickeyAuthenticator;
import org.apache.sshd.server.keyprovider.SimpleGeneratorHostKeyProvider;
import org.apache.sshd.server.shell.ProcessShellCommandFactory;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

class SshCommandExecutorTest {

  private static SshServer sshServer;
  private static int port;
  private static Path tempKeyFile;

  @BeforeAll
  static void setupServer() throws Exception {
    sshServer = SshServer.setUpDefaultServer();
    sshServer.setPort(0); // 0 = random available port
    sshServer.setKeyPairProvider(new SimpleGeneratorHostKeyProvider());

    // Accept any public key for simplicity
    sshServer.setPublickeyAuthenticator(AcceptAllPublickeyAuthenticator.INSTANCE);
    sshServer.setCommandFactory(ProcessShellCommandFactory.INSTANCE);
    sshServer.start();
    port = sshServer.getPort();

    KeyPair keyPair = TestKeyUtils.generateRsaKeyPair();
    tempKeyFile = TestKeyUtils.writePrivateKeyToPem(keyPair, "id_rsa");
  }

  @AfterAll
  static void tearDownServer() throws Exception {
    if (sshServer != null) {
      sshServer.stop();
    }
    Files.deleteIfExists(tempKeyFile);
  }

  @Test
  void testExecuteCommand() throws Exception {
    try (var executor = new SshCommandExecutor(
        "localhost",
        port,
        "testuser",
        tempKeyFile.toAbsolutePath().toString(),
        new NoBecome())
    ) {
      CommandResult result = executor.execute("ls -l");

      Assertions.assertEquals(0, result.exitCode());
      Assertions.assertFalse(result.stdout().isEmpty());
      Assertions.assertTrue(result.stderr().isEmpty());
    }
  }
}
