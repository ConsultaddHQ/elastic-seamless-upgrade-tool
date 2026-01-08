package co.hyperflex.precheck.concrete.index;

import co.hyperflex.clients.client.ApiRequest;
import co.hyperflex.precheck.contexts.IndexContext;
import co.hyperflex.precheck.core.BaseIndexPrecheck;
import co.hyperflex.precheck.core.enums.PrecheckSeverity;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;
import java.util.Set;
import org.slf4j.Logger;
import org.springframework.stereotype.Component;

@Component
public class IndexFieldCountPrecheck extends BaseIndexPrecheck {

  private static final int FIELD_LIMIT = 1000;
  private final ObjectMapper objectMapper;

  public IndexFieldCountPrecheck(ObjectMapper objectMapper) {
    this.objectMapper = objectMapper;
  }

  @Override
  public String getName() {
    return "Mapped Field Count Check";
  }

  @Override
  public void run(IndexContext context) {
    String indexName = context.getIndexName();
    Logger logger = context.getLogger();
    var uri = "/" + indexName + "/_mapping";

    var request = ApiRequest.builder(String.class).get().uri(uri).build();


    JsonNode root;
    try {
      root = objectMapper.readTree(context.getElasticClient().execute(request));
    } catch (JsonProcessingException e) {
      throw new RuntimeException(e);
    }
    JsonNode propertiesNode = root.path(indexName).path("mappings").path("properties");
    if (propertiesNode.isMissingNode() || propertiesNode.isEmpty()) {
      logger.info("Index [{}] has no properties defined.", indexName);
      return;
    }

    int fieldCount = countFields(propertiesNode);
    logger.info("Index [{}] has {} mapped fields.", indexName, fieldCount);

    if (fieldCount > FIELD_LIMIT) {
      logger.warn("Index [{}] exceeds the recommended field count ({} > {}). Consider flattening mappings.", indexName, fieldCount,
          FIELD_LIMIT);
    }

  }

  @Override
  public PrecheckSeverity getSeverity() {
    return PrecheckSeverity.WARNING;
  }

  private int countFields(JsonNode propertiesNode) {
    int count = 0;
    Set<Map.Entry<String, JsonNode>> fields = propertiesNode.properties();
    for (Map.Entry<String, JsonNode> entry : fields) {
      count++;

      JsonNode propNode = entry.getValue();
      JsonNode nestedProps = null;

      if (propNode.has("type") && propNode.get("type").asText().equals("object")) {
        nestedProps = propNode.path("properties");
      } else if (propNode.has("type") && propNode.get("type").asText().equals("nested")) {
        nestedProps = propNode.path("properties");
      }

      if (nestedProps != null && !nestedProps.isMissingNode() && !nestedProps.isEmpty()) {
        count += countFields(nestedProps);
      }
    }

    return count;
  }
}
