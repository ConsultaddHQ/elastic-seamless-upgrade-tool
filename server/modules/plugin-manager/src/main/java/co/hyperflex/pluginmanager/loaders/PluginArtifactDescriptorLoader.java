package co.hyperflex.pluginmanager.loaders;

import co.hyperflex.pluginmanager.entities.PluginArtifactDescriptor;
import co.hyperflex.pluginmanager.repositories.PluginArtifactDescriptorRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import java.io.File;
import java.io.IOException;
import java.lang.reflect.Type;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class PluginArtifactDescriptorLoader {

  private final PluginArtifactDescriptorRepository repository;
  private final ObjectMapper objectMapper;
  private final Logger logger = LoggerFactory.getLogger(PluginArtifactDescriptorLoader.class);

  public PluginArtifactDescriptorLoader(PluginArtifactDescriptorRepository repository, ObjectMapper objectMapper) {
    this.repository = repository;
    this.objectMapper = objectMapper;
  }

  @PostConstruct
  public void init() {
    try {
      File file = new File("data/plugin-artifact-descriptor.json");
      JsonNode root = objectMapper.readTree(file);
      List<PluginArtifactDescriptor> descriptors = objectMapper.readerFor(new TypeReference<List<PluginArtifactDescriptor>>() {
        @Override
        public Type getType() {
          return super.getType();
        }
      }).readValue(root);

      descriptors.forEach(d -> d.setId(d.getName()));

      repository.saveAll(descriptors);
    } catch (IOException e) {
      logger.error("Error reading plugin-artifact-descriptor.json", e);
    }
  }

}
