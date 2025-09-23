package co.hyperflex.breakingchanges.loaders;

import co.hyperflex.breakingchanges.BreakingChangeRepository;
import co.hyperflex.breakingchanges.entities.BreakingChangeEntity;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import java.io.File;
import java.io.IOException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class BreakingChangesLoader {

  private final BreakingChangeRepository repository;
  private final ObjectMapper objectMapper;
  private final Logger logger = LoggerFactory.getLogger(BreakingChangesLoader.class);

  public BreakingChangesLoader(BreakingChangeRepository repository, ObjectMapper objectMapper) {
    this.repository = repository;
    this.objectMapper = objectMapper;
  }

  @PostConstruct
  public void init() {
    try {
      JsonNode root = objectMapper.readTree(new File("data/breaking-changes.json"));

      repository.deleteAll();

      for (JsonNode versionNode : root) {
        String version = versionNode.get("version").asText();
        String url = versionNode.get("url").asText();
        JsonNode breakingChanges = versionNode.get("breaking_changes");

        if (breakingChanges != null && breakingChanges.isArray()) {
          for (JsonNode categoryNode : breakingChanges) {
            String category = categoryNode.get("category").asText();
            for (JsonNode change : categoryNode.get("changes")) {
              String title = getFirstMatchingField(change, "setting", "issue", "requirement", "name", "change", "field");
              String description = getFirstMatchingField(change, "description", "details");
              String impact = getFirstMatchingField(change, "impact");
              BreakingChangeEntity breakingChange = new BreakingChangeEntity();
              breakingChange.setTitle(title);
              breakingChange.setDescription("Details:\n" + description + "\n\nImpact:\n" + impact);
              breakingChange.setUrl("Source: " + url);
              breakingChange.setVersion(version);
              breakingChange.setCategory(category);
              repository.save(breakingChange);
            }
          }
        }
      }

    } catch (IOException e) {
      logger.error("Error reading breaking-changes.json", e);
    }
  }

  private String getFirstMatchingField(JsonNode node, String... fields) {
    for (String field : fields) {
      JsonNode value = node.get(field);
      if (value != null && !value.isNull()) {
        return value.asText();
      }
    }
    return "";
  }

}
