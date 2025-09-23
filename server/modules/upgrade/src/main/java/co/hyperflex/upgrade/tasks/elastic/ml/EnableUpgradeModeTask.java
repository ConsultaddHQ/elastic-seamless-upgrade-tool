package co.hyperflex.upgrade.tasks.elastic.ml;

import co.hyperflex.common.client.ApiRequest;
import co.hyperflex.upgrade.tasks.Context;
import co.hyperflex.upgrade.tasks.Task;
import co.hyperflex.upgrade.tasks.TaskResult;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.stereotype.Component;

@Component
public class EnableUpgradeModeTask implements Task {

  @Override
  public String getName() {
    return "Temporarily stopping the tasks associated with active machine learning jobs and datafeeds.";
  }

  @Override
  public TaskResult run(Context context) {
    var client = context.elasticClient();
    ApiRequest<JsonNode> request = ApiRequest.builder(JsonNode.class)
        .post()
        .uri("/_ml/set_upgrade_mode?enabled=true")
        .build();
    JsonNode response = client.execute(request);
    if (!response.get("acknowledged").asBoolean()) {
      throw new IllegalStateException("Enable upgrade mode failed");
    }
    return TaskResult.success("Upgrade mode enabled");
  }
}
