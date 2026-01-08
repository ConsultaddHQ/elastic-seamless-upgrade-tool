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
public class EnableUpgradeModeTask implements Task {
  private final ObjectMapper mapper;

  public EnableUpgradeModeTask(ObjectMapper mapper) {
    this.mapper = mapper;
  }

  @Override
  public String getName() {
    return "Temporarily stopping the tasks associated with active machine learning jobs and datafeeds.";
  }

  @Override
  public TaskResult run(Context context) {
    var client = context.elasticClient();
    ApiRequest<String> request = ApiRequest.builder(String.class)
        .post()
        .uri("/_ml/set_upgrade_mode?enabled=true")
        .build();
    JsonNode response;
    try {
      response = mapper.readTree(client.execute(request));
    } catch (JsonProcessingException e) {
      throw new RuntimeException(e);
    }
    if (!response.get("acknowledged").asBoolean()) {
      throw new IllegalStateException("Enable upgrade mode failed");
    }
    return TaskResult.success("Upgrade mode enabled");
  }
}
