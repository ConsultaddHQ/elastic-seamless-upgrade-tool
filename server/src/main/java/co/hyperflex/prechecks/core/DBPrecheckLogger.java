package co.hyperflex.prechecks.core;

import co.hyperflex.entities.precheck.PrecheckRun;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class DBPrecheckLogger implements PrecheckLogger {
  private final PrecheckRun precheckRun;
  private final Logger slf4jLogger = LoggerFactory.getLogger(DBPrecheckLogger.class);

  public DBPrecheckLogger(PrecheckRun precheckRun) {
    this.precheckRun = precheckRun;
  }

  private void saveLog(String level, String message) {
    // TODO we need to thing about it
    precheckRun.getLogs().add(String.format("[%s] %s", level, message));
  }

  @Override
  public void info(String message, Object... args) {
    String resolved = String.format(message, args);
    slf4jLogger.info(resolved);
    saveLog("INFO", resolved);
  }

  @Override
  public void warn(String message, Object... args) {
    String resolved = String.format(message, args);
    slf4jLogger.warn(resolved);
    saveLog("WARN", resolved);
  }

  @Override
  public void error(String message, Object... args) {
    String resolved = String.format(message, args);
    slf4jLogger.error(resolved);
    saveLog("ERROR", resolved);
  }

}

