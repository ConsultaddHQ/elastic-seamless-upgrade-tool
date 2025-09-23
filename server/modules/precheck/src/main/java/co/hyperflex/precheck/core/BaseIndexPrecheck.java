package co.hyperflex.precheck.core;

import co.hyperflex.precheck.contexts.IndexContext;
import co.hyperflex.precheck.core.enums.PrecheckType;

public abstract non-sealed class BaseIndexPrecheck implements Precheck<IndexContext> {

  @Override
  public final PrecheckType getType() {
    return PrecheckType.INDEX;
  }
}
