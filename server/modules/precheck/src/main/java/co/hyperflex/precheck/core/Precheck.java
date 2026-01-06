package co.hyperflex.precheck.core;

import co.hyperflex.precheck.contexts.PrecheckContext;
import co.hyperflex.precheck.core.enums.PrecheckSeverity;
import co.hyperflex.precheck.core.enums.PrecheckType;

public sealed interface Precheck<T extends PrecheckContext> permits BaseClusterPrecheck, BaseIndexPrecheck, BaseNodePrecheck {
  String getName();

  PrecheckType getType();

  void run(T context);

  default String getId() {
    return this.getClass().getName();
  }

  default PrecheckSeverity getSeverity() {
    return PrecheckSeverity.ERROR;
  }

  default boolean shouldRun(T context) {
    return true;
  }

  /**
   * Pre-run hook: optional setup or early validation.
   * Return false to skip actual run.
   */
  default boolean preRun(T context) {
    return true;
  }

  default boolean skippable() {
    return true;
  }
}
