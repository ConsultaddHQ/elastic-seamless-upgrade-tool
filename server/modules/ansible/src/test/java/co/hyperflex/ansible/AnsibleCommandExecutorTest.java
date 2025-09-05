package co.hyperflex.ansible;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import co.hyperflex.ansible.commands.AnsibleAdHocCommand;
import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.util.Map;
import java.util.function.Consumer;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AnsibleCommandExecutorTest {

  @Spy
  @InjectMocks
  private AnsibleCommandExecutor ansibleCommandExecutor;

  @Test
  void run_aptCommand_success() throws Exception {
    // Arrange
    var cmd = AnsibleAdHocCommand.builder()
        .apt()
        .args(Map.of("name", "nginx", "state", "present"))
        .build();
    ExecutionContext executionContext = new ExecutionContext(
        "127.0.0.1",
        "user",
        "/path/to/key",
        true,
        "root"
    );
    Process process = mock(Process.class);
    InputStream inputStream = new ByteArrayInputStream("stdout line".getBytes());
    InputStream errorStream = new ByteArrayInputStream("stderr line".getBytes());

    when(process.getInputStream()).thenReturn(inputStream);
    when(process.getErrorStream()).thenReturn(errorStream);
    when(process.waitFor()).thenReturn(0);
    doReturn(process).when(ansibleCommandExecutor).getProcess(executionContext, cmd);

    Consumer<String> stdLogsConsumer = mock(Consumer.class);
    Consumer<String> errLogsConsumer = mock(Consumer.class);

    // Act
    int exitCode = ansibleCommandExecutor.run(executionContext, cmd, stdLogsConsumer, errLogsConsumer);

    // Assert
    assertEquals(0, exitCode);
    verify(stdLogsConsumer).accept("stdout line");
    verify(errLogsConsumer).accept("stderr line");
  }

  @Test
  void run_systemdCommand_success() throws Exception {
    // Arrange
    ExecutionContext executionContext = new ExecutionContext(
        "127.0.0.1",
        "user",
        "/path/to/key",
        true,
        "root"
    );
    var cmd = AnsibleAdHocCommand.builder()
        .systemd()
        .args(Map.of("name", "nginx", "state", "restarted"))
        .build();

    Process process = mock(Process.class);
    InputStream inputStream = new ByteArrayInputStream("restarted".getBytes());
    InputStream errorStream = new ByteArrayInputStream("".getBytes());

    when(process.getInputStream()).thenReturn(inputStream);
    when(process.getErrorStream()).thenReturn(errorStream);
    when(process.waitFor()).thenReturn(0);
    doReturn(process).when(ansibleCommandExecutor).getProcess(executionContext, cmd);

    Consumer<String> stdLogsConsumer = mock(Consumer.class);
    Consumer<String> errLogsConsumer = mock(Consumer.class);

    // Act
    int exitCode = ansibleCommandExecutor.run(executionContext, cmd, stdLogsConsumer, errLogsConsumer);

    // Assert
    assertEquals(0, exitCode);
    verify(stdLogsConsumer).accept("restarted");
    verify(errLogsConsumer, never()).accept(any());
  }
}
