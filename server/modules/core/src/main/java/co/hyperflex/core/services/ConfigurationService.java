package co.hyperflex.core.services;

import jakarta.annotation.PostConstruct;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileWriter;
import java.io.IOException;
import java.io.InputStream;
import java.io.Writer;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Supplier;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.yaml.snakeyaml.DumperOptions;
import org.yaml.snakeyaml.Yaml;

@Service
public class ConfigurationService {

  private static final Logger log = LoggerFactory.getLogger(ConfigurationService.class);
  private final File configFile;
  private Map<String, Object> data = new HashMap<>();

  public ConfigurationService(@Value("${seamless.output.dir}") String outputDir) {
    this.configFile = new File(outputDir, "app.yaml");
  }

  @PostConstruct
  public void init() throws IOException {
    if (!configFile.exists()) {
      createEmptyConfig();
    } else {
      load();
    }
  }

  private void createEmptyConfig() throws IOException {
    // Initialize empty map and save
    data = new HashMap<>();
    if (configFile.getParentFile() != null && !configFile.getParentFile().exists()) {
      configFile.getParentFile().mkdirs(); // create directories if needed
    }
    configFile.createNewFile();
    save();
  }

  private void load() throws FileNotFoundException {
    Yaml yaml = new Yaml();
    try (InputStream inputStream = new FileInputStream(configFile)) {
      Object obj = yaml.load(inputStream);
      if (obj instanceof Map map) {
        data = map;
      } else {
        data = new HashMap<>();
      }
    } catch (Exception e) {
      log.warn("Failed to load config file", e);
      throw new RuntimeException(e);
    }
  }

  private synchronized void save() {
    DumperOptions options = new DumperOptions();
    options.setIndent(2);
    options.setPrettyFlow(true);
    options.setDefaultFlowStyle(DumperOptions.FlowStyle.BLOCK);
    Yaml yaml = new Yaml(options);

    try (Writer writer = new FileWriter(configFile)) {
      yaml.dump(data, writer);
    } catch (IOException e) {
      log.warn("Failed to save config file", e);
      throw new RuntimeException(e);
    }
  }

  public synchronized <T> T get(String key) {
    return (T) data.get(key);
  }

  /**
   * Get the value for a key. If the key doesn't exist, use the supplier
   * to generate a default value, set it in the YAML, and return it.
   */
  public synchronized <T> T getOrInitialize(String key, Supplier<T> defaultSupplier) {
    if (data.containsKey(key)) {
      return (T) data.get(key);
    } else {
      T defaultValue = defaultSupplier.get();
      data.put(key, defaultValue);
      save(); // persist the new value
      return defaultValue;
    }
  }

  public synchronized <T> void set(String key, T value) {
    data.put(key, value);
    save();
  }

  public synchronized void remove(String key) {
    data.remove(key);
    save();
  }

  public synchronized Map<String, Object> getAll() {
    return new HashMap<>(data);
  }
}
