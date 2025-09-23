package co.hyperflex.pluginmanager;

import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class KibanaPluginArtifactValidatorTest {

  @Test
  void verifyPlugin_shouldAlwaysReturnTrue() {
    KibanaPluginArtifactValidator validator = new KibanaPluginArtifactValidator();
    assertTrue(validator.verifyPlugin("any-url", "any-version"));
  }
}
