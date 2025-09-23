package co.hyperflex.pluginmanager;

import org.springframework.stereotype.Component;

@Component
public class KibanaPluginArtifactValidator implements PluginArtifactValidator {

  @Override
  public boolean verifyPlugin(String pluginUrl, String version) {
    return true;
  }

}
