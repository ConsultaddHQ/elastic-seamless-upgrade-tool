package co.hyperflex.precheck.core;

import co.hyperflex.precheck.contexts.NodeContext;
import co.hyperflex.precheck.core.enums.PrecheckType;

public abstract non-sealed class BaseNodePrecheck implements Precheck<NodeContext> {

  @Override
  public final PrecheckType getType() {
    return PrecheckType.NODE;
  }
}
