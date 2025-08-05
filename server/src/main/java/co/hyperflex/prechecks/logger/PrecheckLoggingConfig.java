package co.hyperflex.prechecks.logger;

import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.LoggerContext;
import co.hyperflex.prechecks.contexts.resolver.PrecheckContextResolver;
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

    Logger rootLogger = context.getLogger(PrecheckContextResolver.class.getName());
    rootLogger.addAppender(precheckContextAwareAppender);
  }
}

