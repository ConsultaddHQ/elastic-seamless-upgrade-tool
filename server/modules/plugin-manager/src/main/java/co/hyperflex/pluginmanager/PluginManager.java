package co.hyperflex.pluginmanager;

import java.util.List;

public interface PluginManager {
  List<String> listPlugins();

  void removePlugin(String pluginName);

  boolean isPluginAvailable(String pluginName, String version);

  void installPlugin(String pluginName, String version);
}
