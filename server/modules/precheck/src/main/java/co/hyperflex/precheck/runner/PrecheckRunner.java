package co.hyperflex.precheck.runner;

import co.hyperflex.precheck.entities.PrecheckRunEntity;
import co.hyperflex.precheck.services.PrecheckRunService;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class PrecheckRunner {
  private static final Logger LOG = LoggerFactory.getLogger(PrecheckRunner.class);
  private final PrecheckTaskExecutor taskExecutor;
  private final PrecheckRunService precheckRunService;

  public PrecheckRunner(PrecheckTaskExecutor taskExecutor, PrecheckRunService precheckRunService) {
    this.taskExecutor = taskExecutor;
    this.precheckRunService = precheckRunService;
  }

  @Scheduled(fixedDelay = 5000)
  public void runNextBatch() {
    List<PrecheckRunEntity> pending = precheckRunService.getPendingPrechecks();
    if (pending.isEmpty()) {
      LOG.debug("No pending precheck runs found");
      return;
    }

    LOG.info("Found {} precheck runs", pending.size());

    List<CompletableFuture<Void>> futures = pending.stream()
        .map(taskExecutor::executeOne)
        .toList();

    CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();
  }
}
