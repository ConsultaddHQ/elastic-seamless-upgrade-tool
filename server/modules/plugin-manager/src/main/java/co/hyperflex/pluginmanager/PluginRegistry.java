package co.hyperflex.pluginmanager;

import jakarta.annotation.Nullable;

public interface PluginRegistry {
  boolean isOfficial(String pluginName);

  @Nullable
  String getPluginSource(String pluginName, String version);
}
