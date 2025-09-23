package co.hyperflex.precheck.core;

import co.hyperflex.core.models.enums.ClusterNodeType;
import co.hyperflex.precheck.contexts.NodeContext;

public abstract class BaseElasticNodePrecheck extends BaseNodePrecheck {

  @Override
  public boolean shouldRun(NodeContext context) {
    return context.getNode().getType() == ClusterNodeType.ELASTIC;
  }
}
