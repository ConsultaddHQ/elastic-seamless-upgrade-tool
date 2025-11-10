package co.hyperflex.upgrade.tasks.kibana;

import co.hyperflex.clients.kibana.KibanaClient;
import co.hyperflex.common.client.ApiRequest;
import co.hyperflex.upgrade.tasks.Context;
import co.hyperflex.upgrade.tasks.Task;
import co.hyperflex.upgrade.tasks.TaskResult;
import java.util.Map;
import org.slf4j.Logger;
import org.springframework.stereotype.Component;

@Component
public class SetDefaultIndexTask implements Task {

  @Override
  public String getName() {
    return "Set default index(syslog)";
  }

  @Override
  public TaskResult run(Context context) {
    final Logger logger = context.logger();
    final String host = context.node().getIp();
    final KibanaClient kibanaClient = context.kibanaClient();

    logger.info("Setting default index");

    String url = kibanaClient.baseUrl(host) + "/api/kibana/settings";
    try {
      String requestBody = "{\"changes\":{\"defaultIndex\":\"syslog\"}}";

      var request = ApiRequest.builder(Map.class)
          .uri(url)
          .post()
          .addHeader("kbn-version", context.config().targetVersion())
          .body(requestBody)
          .build();

      var response = kibanaClient.execute(request);
      logger.info("Successfully set default index.");
      return TaskResult.success("Default index set.");
    } catch (Exception e) {
      logger.error("Failed to set default index.", e);
      return TaskResult.failure("Failed to set default index.");
    }

  }
}
