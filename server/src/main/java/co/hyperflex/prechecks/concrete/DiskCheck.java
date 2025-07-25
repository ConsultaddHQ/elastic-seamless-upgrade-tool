package co.hyperflex.prechecks.concrete;

import co.hyperflex.prechecks.contexts.NodeContext;
import co.hyperflex.prechecks.core.BaseNodePrecheck;
import org.springframework.stereotype.Component;

@Component
public class DiskCheck extends BaseNodePrecheck {

  @Override
  public String getName() {
    return "";
  }

  @Override
  public void run(NodeContext context) {

  }
}
