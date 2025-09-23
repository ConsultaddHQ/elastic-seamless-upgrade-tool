package co.hyperflex.upgrade.tasks.elastic;

import co.hyperflex.pluginmanager.PluginManagerFactory;
import co.hyperflex.upgrade.tasks.AbstractUpdatePluginTask;
import org.springframework.stereotype.Component;

@Component
public class UpdateElasticPluginTask extends AbstractUpdatePluginTask {

  public UpdateElasticPluginTask(PluginManagerFactory pluginManagerFactory) {
    super(pluginManagerFactory);
  }

  @Override
  public String getName() {
    return "Update elastic plugins";
  }
}
