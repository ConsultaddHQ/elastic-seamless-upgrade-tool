package co.hyperflex.upgrade.tasks.kibana;

import co.hyperflex.pluginmanager.PluginManagerFactory;
import co.hyperflex.upgrade.tasks.AbstractUpdatePluginTask;
import org.springframework.stereotype.Component;

@Component
public class UpdateKibanaPluginTask extends AbstractUpdatePluginTask {
  public UpdateKibanaPluginTask(PluginManagerFactory pluginManagerFactory) {
    super(pluginManagerFactory);
  }

  @Override
  public String getName() {
    return "Update kibana plugins";
  }
}
