package co.hyperflex.precheck.runner;

import co.hyperflex.common.exceptions.NotFoundException;
import co.hyperflex.core.services.notifications.NotificationService;
import co.hyperflex.core.services.notifications.PrecheckProgressChangeEvent;
import co.hyperflex.precheck.contexts.ClusterContext;
import co.hyperflex.precheck.contexts.IndexContext;
import co.hyperflex.precheck.contexts.NodeContext;
import co.hyperflex.precheck.contexts.PrecheckContext;
import co.hyperflex.precheck.contexts.resolver.PrecheckContextResolver;
import co.hyperflex.precheck.core.BaseClusterPrecheck;
import co.hyperflex.precheck.core.BaseIndexPrecheck;
import co.hyperflex.precheck.core.BaseNodePrecheck;
import co.hyperflex.precheck.core.Precheck;
import co.hyperflex.precheck.core.PrecheckFailedException;
import co.hyperflex.precheck.core.enums.PrecheckStatus;
import co.hyperflex.precheck.entities.PrecheckRunEntity;
import co.hyperflex.precheck.registry.PrecheckRegistry;
import co.hyperflex.precheck.services.PrecheckRunService;
import java.util.concurrent.CompletableFuture;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class PrecheckTaskExecutor {

  private static final Logger LOG = LoggerFactory.getLogger(PrecheckTaskExecutor.class);

  private final PrecheckRegistry precheckRegistry;
  private final PrecheckContextResolver precheckContextResolver;
  private final NotificationService notificationService;
  private final PrecheckRunService precheckRunService;

  public PrecheckTaskExecutor(PrecheckRegistry precheckRegistry,
                              PrecheckContextResolver precheckContextResolver, NotificationService notificationService,
                              PrecheckRunService precheckRunService) {
    this.precheckRegistry = precheckRegistry;
    this.precheckContextResolver = precheckContextResolver;
    this.notificationService = notificationService;
    this.precheckRunService = precheckRunService;
  }

  @Async("precheckAsyncExecutor")
  public CompletableFuture<Void> executeOne(PrecheckRunEntity record) {
    PrecheckContext context = precheckContextResolver.resolveContext(record);
    try {
      MDC.put("precheckRunId", record.getId());
      precheckRunService.updatePrecheckStatus(record.getId(), PrecheckStatus.RUNNING);
      Precheck<?> precheck = precheckRegistry.getById(record.getPrecheckId())
          .orElseThrow(() -> new NotFoundException("Precheck not found: " + record.getPrecheckId()));

      switch (record.getType()) {
        case NODE -> ((BaseNodePrecheck) precheck).run((NodeContext) context);
        case INDEX -> ((BaseIndexPrecheck) precheck).run((IndexContext) context);
        case CLUSTER -> ((BaseClusterPrecheck) precheck).run((ClusterContext) context);
        default -> throw new IllegalArgumentException("Unknown precheck type: " + record.getType());
      }
      precheckRunService.updatePrecheckStatus(record.getId(), PrecheckStatus.COMPLETED);

    } catch (Exception e) {
      if (e instanceof PrecheckFailedException) {
        context.getLogger().error(e.getMessage());
      }
      LOG.error("Error executing precheck: {}", record.getId(), e);
      precheckRunService.updatePrecheckStatus(record.getId(), PrecheckStatus.FAILED);
    } finally {
      notificationService.sendNotification(new PrecheckProgressChangeEvent());
      MDC.clear();
    }
    return CompletableFuture.completedFuture(null);
  }

}
