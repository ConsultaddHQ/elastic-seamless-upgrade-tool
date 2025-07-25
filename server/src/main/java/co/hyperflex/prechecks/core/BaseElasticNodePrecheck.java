package co.hyperflex.prechecks.core;

import co.hyperflex.entities.cluster.ClusterNodeType;
import co.hyperflex.prechecks.contexts.NodeContext;

public abstract class BaseElasticNodePrecheck extends BaseNodePrecheck {

  @Override
  public boolean shouldRun(NodeContext context) {
    return context.getNode().getType() == ClusterNodeType.ELASTIC;
  }
}
