package co.hyperflex.pluginmanager;

public interface PluginArtifactValidator {
  boolean verifyPlugin(String pluginUrl, String targetEsVersion);
}
