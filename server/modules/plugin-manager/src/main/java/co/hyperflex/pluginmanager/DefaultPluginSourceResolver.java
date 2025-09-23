package co.hyperflex.pluginmanager;

import java.util.Optional;
import org.springframework.stereotype.Component;

@Component
public class DefaultPluginSourceResolver implements PluginSourceResolver {
  private final PluginRegistry registry;

  public DefaultPluginSourceResolver(PluginRegistry registry) {
    this.registry = registry;
  }

  @Override
  public String resolve(String pluginName, String version) {
    if (registry.isOfficial(pluginName)) {
      return pluginName; // official plugins use name only
    }
    return Optional.ofNullable(registry.getPluginSource(pluginName, version))
        .orElseThrow(() -> new IllegalArgumentException("Unknown plugin: " + pluginName));
  }
}
