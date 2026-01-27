package co.hyperflex.precheck.core;

import co.hyperflex.precheck.contexts.IndexContext;
import co.hyperflex.precheck.core.enums.PrecheckType;

public abstract non-sealed class BaseIndexPrecheck implements Precheck<IndexContext> {

  @Override
  public final PrecheckType getType() {
    return PrecheckType.INDEX;
  }

  @Override
  public boolean preRun(IndexContext context) {
    try {
      context.getElasticClient().getShards(context.getIndexName());
    } catch (Exception e) {
      context.getLogger().info("Index no longer exists; skipping this precheck.");
      return false;
    }
    return true;
  }
}
