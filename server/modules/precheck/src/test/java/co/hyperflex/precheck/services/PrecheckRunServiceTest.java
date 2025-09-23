package co.hyperflex.precheck.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

import co.hyperflex.precheck.core.enums.PrecheckSeverity;
import co.hyperflex.precheck.core.enums.PrecheckStatus;
import co.hyperflex.precheck.repositories.PrecheckRunRepository;
import co.hyperflex.precheck.repositories.projection.PrecheckStatusAndSeverityView;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.mongodb.core.MongoTemplate;

@ExtendWith(MockitoExtension.class)
class PrecheckRunServiceTest {

  @Mock
  private PrecheckRunRepository precheckRunRepository;
  @Mock
  private MongoTemplate mongoTemplate; // Mocked but not used in these specific tests

  @InjectMocks
  private PrecheckRunService precheckRunService;

  @Test
  void getStatusByUpgradeJobId_whenAllCompleted_shouldReturnCompleted() {
    String jobId = "job-1";
    List<PrecheckStatusAndSeverityView> views = List.of(
        new PrecheckStatusAndSeverityView(PrecheckStatus.COMPLETED, PrecheckSeverity.ERROR)
    );
    when(precheckRunRepository.findStatusAndSeverityByUpgradeJobId(jobId)).thenReturn(views);

    PrecheckStatus status = precheckRunService.getStatusByUpgradeJobId(jobId);

    assertEquals(PrecheckStatus.COMPLETED, status);
  }

  @Test
  void getStatusByUpgradeJobId_whenOneFailed_shouldReturnFailed() {
    String jobId = "job-1";
    List<PrecheckStatusAndSeverityView> views = List.of(
        new PrecheckStatusAndSeverityView(PrecheckStatus.COMPLETED, PrecheckSeverity.ERROR),
        new PrecheckStatusAndSeverityView(PrecheckStatus.FAILED, PrecheckSeverity.ERROR)
    );
    when(precheckRunRepository.findStatusAndSeverityByUpgradeJobId(jobId)).thenReturn(views);

    PrecheckStatus status = precheckRunService.getStatusByUpgradeJobId(jobId);

    assertEquals(PrecheckStatus.FAILED, status);
  }

  @Test
  void getStatusByUpgradeJobId_whenRunningAndPending_shouldReturnRunning() {
    String jobId = "job-1";
    List<PrecheckStatusAndSeverityView> views = List.of(
        new PrecheckStatusAndSeverityView(PrecheckStatus.COMPLETED, PrecheckSeverity.ERROR),
        new PrecheckStatusAndSeverityView(PrecheckStatus.PENDING, PrecheckSeverity.ERROR),
        new PrecheckStatusAndSeverityView(PrecheckStatus.RUNNING, PrecheckSeverity.ERROR)
    );
    when(precheckRunRepository.findStatusAndSeverityByUpgradeJobId(jobId)).thenReturn(views);

    PrecheckStatus status = precheckRunService.getStatusByUpgradeJobId(jobId);

    assertEquals(PrecheckStatus.RUNNING, status);
  }

  @Test
  void getStatusByUpgradeJobId_whenWarningAndFailed_shouldReturnFailed() {
    String jobId = "job-1";
    List<PrecheckStatusAndSeverityView> views = List.of(
        new PrecheckStatusAndSeverityView(PrecheckStatus.FAILED, PrecheckSeverity.WARNING),
        new PrecheckStatusAndSeverityView(PrecheckStatus.FAILED, PrecheckSeverity.ERROR)
    );
    when(precheckRunRepository.findStatusAndSeverityByUpgradeJobId(jobId)).thenReturn(views);

    PrecheckStatus status = precheckRunService.getStatusByUpgradeJobId(jobId);

    assertEquals(PrecheckStatus.FAILED, status);
  }

  @Test
  void getStatusByUpgradeJobId_whenOnlyWarnings_shouldReturnCompleted() {
    String jobId = "job-1";
    List<PrecheckStatusAndSeverityView> views = List.of(
        new PrecheckStatusAndSeverityView(PrecheckStatus.COMPLETED, PrecheckSeverity.WARNING)
    );
    when(precheckRunRepository.findStatusAndSeverityByUpgradeJobId(jobId)).thenReturn(views);

    PrecheckStatus status = precheckRunService.getStatusByUpgradeJobId(jobId);

    assertEquals(PrecheckStatus.COMPLETED, status);
  }
}
