package co.hyperflex.precheck.runner;

import static org.mockito.Mockito.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

import co.hyperflex.precheck.entities.ClusterPrecheckRunEntity;
import co.hyperflex.precheck.entities.NodePrecheckRunEntity;
import co.hyperflex.precheck.entities.PrecheckRunEntity;
import co.hyperflex.precheck.services.PrecheckRunService;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class PrecheckRunnerTest {

  @Mock
  private PrecheckTaskExecutor taskExecutor;

  @Mock
  private PrecheckRunService precheckRunService;

  @InjectMocks
  private PrecheckRunner precheckRunner;

  @Test
  void runNextBatch_withPendingPrechecks_executesTasks() {
    // Arrange
    PrecheckRunEntity run1 = new ClusterPrecheckRunEntity();
    PrecheckRunEntity run2 = new NodePrecheckRunEntity();
    List<PrecheckRunEntity> pendingRuns = List.of(run1, run2);

    when(precheckRunService.getPendingPrechecks(150)).thenReturn(pendingRuns);
    when(taskExecutor.executeOne(any(PrecheckRunEntity.class)))
        .thenReturn(CompletableFuture.completedFuture(null));

    // Act
    precheckRunner.runNextBatch();

    // Assert
    verify(precheckRunService).getPendingPrechecks(150);
    verify(taskExecutor).executeOne(run1);
    verify(taskExecutor).executeOne(run2);
    verifyNoMoreInteractions(taskExecutor);
  }

  @Test
  void runNextBatch_withNoPendingPrechecks_doesNothing() {
    // Arrange
    when(precheckRunService.getPendingPrechecks(150)).thenReturn(Collections.emptyList());

    // Act
    precheckRunner.runNextBatch();

    // Assert
    verify(precheckRunService).getPendingPrechecks(150);
    verifyNoInteractions(taskExecutor);
  }
}
