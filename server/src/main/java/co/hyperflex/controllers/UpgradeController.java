package co.hyperflex.controllers;

import co.hyperflex.clients.ElasticClient;
import co.hyperflex.clients.ElasticsearchClientProvider;
import co.hyperflex.clients.KibanaClient;
import co.hyperflex.clients.KibanaClientProvider;
import co.hyperflex.dtos.upgrades.ClusterNodeUpgradeRequest;
import co.hyperflex.dtos.upgrades.ClusterNodeUpgradeResponse;
import co.hyperflex.dtos.upgrades.ClusterUpgradeRequest;
import co.hyperflex.dtos.upgrades.CreateClusterUpgradeJobRequest;
import co.hyperflex.dtos.upgrades.CreateClusterUpgradeJobResponse;
import co.hyperflex.entities.cluster.ClusterNode;
import co.hyperflex.entities.cluster.KibanaNode;
import co.hyperflex.services.ClusterUpgradeService;
import co.hyperflex.upgrader.planner.UpgradePlanBuilder;
import co.hyperflex.upgrader.tasks.Configuration;
import co.hyperflex.upgrader.tasks.Context;
import co.hyperflex.upgrader.tasks.Task;
import co.hyperflex.upgrader.tasks.TaskResult;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/v1/upgrades")
public class UpgradeController {
  private static final Logger logger = LoggerFactory.getLogger(UpgradeController.class);
  private final ExecutorService executor = Executors.newFixedThreadPool(1);
  private final ElasticsearchClientProvider elasticsearchClientProvider;
  private final KibanaClientProvider kibanaClientProvider;
  private final ClusterUpgradeService clusterUpgradeService;

  public UpgradeController(ElasticsearchClientProvider elasticsearchClientProvider,
                           KibanaClientProvider kibanaClientProvider,
                           ClusterUpgradeService clusterUpgradeService) {
    this.elasticsearchClientProvider = elasticsearchClientProvider;
    this.kibanaClientProvider = kibanaClientProvider;
    this.clusterUpgradeService = clusterUpgradeService;
  }


  @PostMapping("/jobs")
  public CreateClusterUpgradeJobResponse clusterUpgradeJob(
      @RequestBody CreateClusterUpgradeJobRequest request) {
    return clusterUpgradeService.createClusterUpgradeJob(request);
  }

  @PostMapping("/node")
  public ClusterNodeUpgradeResponse clusterNodeUpgrade(
      @RequestBody ClusterNodeUpgradeRequest request) {
    return clusterUpgradeService.upgradeNode(request);
  }


  @PostMapping
  SseEmitter upgrade(@RequestBody ClusterUpgradeRequest upgradeRequest) throws IOException {
    SseEmitter sseEmitter = new SseEmitter();
    ClusterNode clusterNode = new KibanaNode();
    clusterNode.setIp("44.202.236.240");

    Logger logger = LoggerFactory.getLogger(UpgradeController.class);

    ElasticClient elasticClient =
        elasticsearchClientProvider.getElasticsearchClientByClusterId(null);
    KibanaClient kibanaClient = kibanaClientProvider.getKibanaClientByClusterId(null);

    Configuration config = new Configuration(9300, 9200, "ubuntu",
        "/Users/vijay/Projects/elastic-seamless-upgrade-tool/backend/ansible/ssh-keys/SSH_key.pem",
        "8.9.2");
    Context context = new Context(clusterNode, config, logger, elasticClient, kibanaClient);


    UpgradePlanBuilder upgradePlanBuilder = new UpgradePlanBuilder();

    List<Task> tasks = upgradePlanBuilder.buildPlanFor(clusterNode);

    executor.submit(() -> {
      int seq = 0;
      for (Task task : tasks) {
        if (upgradeRequest.isRetry() && seq < upgradeRequest.getRetryFromTaskSeq()) {
          seq++;
          continue;
        }
        TaskResult result = task.run(context);
        System.out.println(result);
        if (!result.isSuccess()) {
          try {
            sseEmitter.send(String.format("Task [taskId: %s] [Sequence: %s] failed with result %s",
                task.getId(), seq, result));
          } catch (IOException ignored) {
            logger.warn("Exception while sending upgrade request to task {}", task.getId(),
                ignored);
          }
          logger.error("Task [taskId: {}] [Sequence: {}] failed with result {}", task.getId(), seq,
              result);
          sseEmitter.complete();
          throw new RuntimeException(result.getMessage());
        }
        seq++;
      }

      sseEmitter.complete();
    });

    final int[] seq = new int[1];

    sseEmitter.send(
        Map.of("tasks", tasks.stream().map(task -> Map.of(
            "taskId", task.getId(),
            "sequence", seq[0]++
        ))));

    return sseEmitter;
  }
}
