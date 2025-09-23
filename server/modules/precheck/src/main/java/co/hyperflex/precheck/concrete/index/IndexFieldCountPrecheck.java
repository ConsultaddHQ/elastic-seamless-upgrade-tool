package co.hyperflex.precheck.concrete.index;

import co.hyperflex.common.client.ApiRequest;
import co.hyperflex.precheck.contexts.IndexContext;
import co.hyperflex.precheck.core.BaseIndexPrecheck;
import co.hyperflex.precheck.core.enums.PrecheckSeverity;
import com.fasterxml.jackson.databind.JsonNode;
import java.util.Map;
import java.util.Set;
import org.slf4j.Logger;
import org.springframework.stereotype.Component;

@Component
public class IndexFieldCountPrecheck extends BaseIndexPrecheck {

  private static final int FIELD_LIMIT = 1000;

  @Override
  public String getName() {
    return "Mapped Field Count Check";
  }

  @Override
  public void run(IndexContext context) {
    String indexName = context.getIndexName();
    Logger logger = context.getLogger();
    var uri = "/" + indexName + "/_mapping";

    var request = ApiRequest
        .builder(JsonNode.class)
        .get()
        .uri(uri)
        .build();


    JsonNode root = context.getElasticClient().execute(request);
    JsonNode propertiesNode = root.path(indexName).path("mappings").path("properties");
    if (propertiesNode.isMissingNode() || propertiesNode.isEmpty()) {
      logger.info("Index [{}] has no properties defined.", indexName);
      return;
    }

    int fieldCount = countFields(propertiesNode);
    logger.info("Index [{}] has {} mapped fields.", indexName, fieldCount);

    if (fieldCount > FIELD_LIMIT) {
      logger.warn(
          "Index [{}] exceeds the recommended field count ({} > {}). Consider flattening mappings.",
          indexName, fieldCount, FIELD_LIMIT
      );
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
