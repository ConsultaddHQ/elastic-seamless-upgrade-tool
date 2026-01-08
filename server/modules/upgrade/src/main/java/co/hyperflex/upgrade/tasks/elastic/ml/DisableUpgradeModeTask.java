package co.hyperflex.upgrade.tasks.elastic.ml;

import co.hyperflex.clients.client.ApiRequest;
import co.hyperflex.upgrade.tasks.Context;
import co.hyperflex.upgrade.tasks.Task;
import co.hyperflex.upgrade.tasks.TaskResult;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

@Component
public class DisableUpgradeModeTask implements Task {
  private final ObjectMapper objectMapper;

  public DisableUpgradeModeTask(ObjectMapper objectMapper) {
    this.objectMapper = objectMapper;
  }

  @Override
  public String getName() {
    return "Restarting machine learning jobs.";
  }

  @Override
  public TaskResult run(Context context) {
    var client = context.elasticClient();
    ApiRequest<String> request = ApiRequest.builder(String.class)
        .post()
        .uri("/_ml/set_upgrade_mode?enabled=false")
        .build();
    try {
      JsonNode response = objectMapper.readTree(client.execute(request));
      if (!response.get("acknowledged").asBoolean()) {
        throw new IllegalStateException("Disable upgrade mode failed");
      }
    } catch (JsonProcessingException e) {
      throw new RuntimeException(e);
    }
    return TaskResult.success("Upgrade mode disabled");
  }
}
