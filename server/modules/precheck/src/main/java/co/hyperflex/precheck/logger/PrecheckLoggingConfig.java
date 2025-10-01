package co.hyperflex.precheck.logger;

import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.LoggerContext;
import co.hyperflex.precheck.core.Precheck;
import jakarta.annotation.PostConstruct;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Configuration;


@Configuration
public class PrecheckLoggingConfig {
  private final PrecheckContextAwareAppender precheckContextAwareAppender;

  public PrecheckLoggingConfig(PrecheckContextAwareAppender precheckContextAwareAppender) {
    this.precheckContextAwareAppender = precheckContextAwareAppender;
  }

  @PostConstruct
  public void attachCustomAppender() {
    LoggerContext context = (LoggerContext) LoggerFactory.getILoggerFactory();
    precheckContextAwareAppender.setContext(context);
    precheckContextAwareAppender.start();

    Logger rootLogger = context.getLogger(Precheck.class);
    rootLogger.addAppender(precheckContextAwareAppender);
  }
}

