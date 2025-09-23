package co.hyperflex.precheck.core;

import co.hyperflex.precheck.contexts.ClusterContext;
import co.hyperflex.precheck.core.enums.PrecheckType;

public abstract non-sealed class BaseClusterPrecheck implements Precheck<ClusterContext> {

  @Override
  public final PrecheckType getType() {
    return PrecheckType.CLUSTER;
  }
}
