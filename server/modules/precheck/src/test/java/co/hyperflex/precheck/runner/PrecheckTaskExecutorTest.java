package co.hyperflex.precheck.runner;

import static org.mockito.Mockito.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import co.hyperflex.core.services.notifications.NotificationService;
import co.hyperflex.precheck.contexts.ClusterContext;
import co.hyperflex.precheck.contexts.resolver.PrecheckContextResolver;
import co.hyperflex.precheck.core.BaseClusterPrecheck;
import co.hyperflex.precheck.core.enums.PrecheckStatus;
import co.hyperflex.precheck.core.enums.PrecheckType;
import co.hyperflex.precheck.entities.ClusterPrecheckRunEntity;
import co.hyperflex.precheck.registry.PrecheckRegistry;
import co.hyperflex.precheck.services.PrecheckRunService;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class PrecheckTaskExecutorTest {

  @Mock
  private PrecheckRegistry precheckRegistry;
  @Mock
  private PrecheckContextResolver precheckContextResolver;
  @Mock
  private NotificationService notificationService;
  @Mock
  private PrecheckRunService precheckRunService;

  @InjectMocks
  private PrecheckTaskExecutor taskExecutor;

  @Test
  void executeOne_whenPrecheckSucceeds_shouldUpdateStatusToCompleted() {
    // Arrange
    ClusterPrecheckRunEntity record = new ClusterPrecheckRunEntity();
    record.setId("run-1");
    record.setPrecheckId("precheck-1");
    record.setType(PrecheckType.CLUSTER);

    BaseClusterPrecheck precheck = mock(BaseClusterPrecheck.class);
    ClusterContext context = mock(ClusterContext.class);
    when(precheck.preRun(any())).thenReturn(true);
    when(precheckRegistry.getById("precheck-1")).thenReturn(Optional.of(precheck));
    when(precheckContextResolver.resolveContext(record)).thenReturn(context);

    // Act
    CompletableFuture<Void> future = taskExecutor.executeOne(record);
    future.join(); // Wait for async execution

    // Assert
    verify(precheckRunService).updatePrecheckStatus("run-1", PrecheckStatus.RUNNING);
    verify(precheck).run(context);
    verify(precheckRunService).updatePrecheckStatus("run-1", PrecheckStatus.COMPLETED);
    verify(notificationService).sendNotification(any());
  }

  @Test
  void executeOne_whenPrecheckThrowsException_shouldUpdateStatusToFailed() {
    // Arrange
    ClusterPrecheckRunEntity record = new ClusterPrecheckRunEntity();
    record.setId("run-1");
    record.setPrecheckId("precheck-1");
    record.setType(PrecheckType.CLUSTER);

    BaseClusterPrecheck precheck = mock(BaseClusterPrecheck.class);
    ClusterContext context = mock(ClusterContext.class);

    when(precheck.preRun(any())).thenReturn(true);
    when(precheckRegistry.getById("precheck-1")).thenReturn(Optional.of(precheck));
    when(precheckContextResolver.resolveContext(record)).thenReturn(context);
    doThrow(new RuntimeException("Test error")).when(precheck).run(context);

    // Act
    CompletableFuture<Void> future = taskExecutor.executeOne(record);
    future.join();

    // Assert
    verify(precheckRunService).updatePrecheckStatus("run-1", PrecheckStatus.RUNNING);
    verify(precheckRunService).updatePrecheckStatus("run-1", PrecheckStatus.FAILED);
    verify(notificationService).sendNotification(any());
  }

  @Test
  void executeOne_whenPrecheckNotFound_shouldUpdateStatusToFailed() {
    // Arrange
    ClusterPrecheckRunEntity record = new ClusterPrecheckRunEntity();
    record.setId("run-1");
    record.setPrecheckId("not-found");

    when(precheckRegistry.getById("not-found")).thenReturn(Optional.empty());
    when(precheckContextResolver.resolveContext(record)).thenReturn(mock(ClusterContext.class));

    // Act
    CompletableFuture<Void> future = taskExecutor.executeOne(record);
    future.join();

    // Assert
    verify(precheckRunService).updatePrecheckStatus("run-1", PrecheckStatus.RUNNING);
    verify(precheckRunService).updatePrecheckStatus("run-1", PrecheckStatus.FAILED);
    verify(notificationService).sendNotification(any());
  }
}
