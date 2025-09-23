package co.hyperflex.upgrade.logger;

import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.LoggerContext;
import co.hyperflex.upgrade.services.UpgradeLogService;
import jakarta.annotation.PostConstruct;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Configuration;


@Configuration
public class UpgradeLoggingConfig {
  private final UpdateContextAwareAppender updateContextAwareAppender;

  public UpgradeLoggingConfig(UpdateContextAwareAppender updateContextAwareAppender) {
    this.updateContextAwareAppender = updateContextAwareAppender;
  }

  @PostConstruct
  public void attachCustomAppender() {
    LoggerContext context = (LoggerContext) LoggerFactory.getILoggerFactory();
    updateContextAwareAppender.setContext(context);
    updateContextAwareAppender.start();

    Logger rootLogger = context.getLogger(UpgradeLogService.class.getName());
    rootLogger.addAppender(updateContextAwareAppender);
  }
}

