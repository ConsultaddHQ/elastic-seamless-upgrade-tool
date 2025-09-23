package co.hyperflex.ssh;

import jakarta.validation.constraints.NotNull;
import java.io.ByteArrayOutputStream;
import java.io.FileInputStream;
import java.io.IOException;
import java.security.KeyPair;
import java.util.EnumSet;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import org.apache.sshd.client.SshClient;
import org.apache.sshd.client.channel.ClientChannel;
import org.apache.sshd.client.channel.ClientChannelEvent;
import org.apache.sshd.client.session.ClientSession;
import org.apache.sshd.common.util.security.SecurityUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class SshCommandExecutor implements AutoCloseable {
  private final Logger logger = LoggerFactory.getLogger(getClass());
  private final SshClient client;
  private final ClientSession session;
  private final long timeoutSeconds;
  private final BecomeStrategy becomeStrategy;

  public SshCommandExecutor(String host, int port, String username, String privateKeyPath, BecomeStrategy becomeStrategy) {
    this(host, port, username, privateKeyPath, 15, becomeStrategy);
  }

  public SshCommandExecutor(String host, int port, String username, String privateKeyPath, long timeoutSeconds,
                            BecomeStrategy becomeStrategy) {
    this.timeoutSeconds = timeoutSeconds;
    this.becomeStrategy = becomeStrategy;
    this.client = SshClient.setUpDefaultClient();
    client.start();
    session = connect(host, port, username, privateKeyPath);
  }

  private ClientSession connect(String host, int port, String username, String privateKeyPath) {
    final ClientSession session;
    try {

      session = client.connect(username, host, port)
          .verify(timeoutSeconds, TimeUnit.SECONDS)
          .getSession();

      try (var stream = new FileInputStream(privateKeyPath)) {
        Iterable<KeyPair> keyPairs = SecurityUtils.loadKeyPairIdentities(session, null, stream, null);
        for (KeyPair kp : keyPairs) {
          session.addPublicKeyIdentity(kp);
        }
      }
      session.auth().verify(timeoutSeconds, TimeUnit.SECONDS);
    } catch (Exception e) {
      if (e.getCause() instanceof TimeoutException) {
        logger.warn("Timeout waiting for private key verification");
        throw new SshConnectionException("Unable to establish SSH connection to host (IP: " + host + ").", e);
      }
      logger.warn("Unable to establish SSH connection to host", e);
      throw new SshConnectionException("SSH authentication failed for host (IP: " + host + ").", e);
    }
    return session;
  }

  public CommandResult execute(@NotNull String command) throws IOException {
    try (ByteArrayOutputStream stdout = new ByteArrayOutputStream();
         ByteArrayOutputStream stderr = new ByteArrayOutputStream();
         ClientChannel channel = session.createExecChannel(becomeStrategy.wrapCommand(command))) {

      channel.setOut(stdout);
      channel.setErr(stderr);

      channel.open().verify(timeoutSeconds, TimeUnit.SECONDS);
      var result = channel.waitFor(EnumSet.of(ClientChannelEvent.CLOSED), TimeUnit.MINUTES.toMillis(10));
      if (result.contains(ClientChannelEvent.TIMEOUT)) {
        throw new SshConnectionException("Command execution timed out: " + command);
      }
      int exitCode = channel.getExitStatus() != null ? channel.getExitStatus() : -1;
      return new CommandResult(exitCode, stdout.toString().trim(), stderr.toString().trim());
    }
  }

  @Override
  public void close() throws IOException {
    try {
      if (session != null && session.isOpen()) {
        session.close(false).await();
      }
    } finally {
      if (client != null && client.isOpen()) {
        client.close();
      }
    }
  }

}