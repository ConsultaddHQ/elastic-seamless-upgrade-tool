package co.hyperflex.pluginmanager;

public interface PluginSourceResolver {
  String resolve(String pluginName, String version);
}
