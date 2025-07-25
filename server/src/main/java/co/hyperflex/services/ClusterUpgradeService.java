package co.hyperflex.services;

import co.elastic.clients.elasticsearch.core.InfoResponse;
import co.hyperflex.clients.ElasticClient;
import co.hyperflex.clients.ElasticsearchClientProvider;
import co.hyperflex.dtos.upgrades.ClusterNodeUpgradeRequest;
import co.hyperflex.dtos.upgrades.ClusterNodeUpgradeResponse;
import co.hyperflex.dtos.upgrades.CreateClusterUpgradeJobRequest;
import co.hyperflex.dtos.upgrades.CreateClusterUpgradeJobResponse;
import co.hyperflex.entities.upgrade.ClusterUpgradeJob;
import co.hyperflex.entities.upgrade.ClusterUpgradeStatus;
import co.hyperflex.exceptions.ConflictException;
import co.hyperflex.repositories.ClusterUpgradeJobRepository;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class ClusterUpgradeService {
  private static final Logger log = LoggerFactory.getLogger(ClusterUpgradeService.class);
  private final ClusterUpgradeJobRepository clusterUpgradeJobRepository;
  private final ElasticsearchClientProvider elasticsearchClientProvider;

  public ClusterUpgradeService(ClusterUpgradeJobRepository clusterUpgradeJobRepository,
                               ElasticsearchClientProvider elasticsearchClientProvider) {
    this.clusterUpgradeJobRepository = clusterUpgradeJobRepository;
    this.elasticsearchClientProvider = elasticsearchClientProvider;
  }

  public CreateClusterUpgradeJobResponse createClusterUpgradeJob(
      @NotNull CreateClusterUpgradeJobRequest request) {

    final String clusterId = request.clusterId();

    List<ClusterUpgradeJob> activeJobs =
        clusterUpgradeJobRepository.findByClusterIdAndStatusIsNot(clusterId,
            ClusterUpgradeStatus.UPDATED);

    if (!activeJobs.isEmpty()) {
      log.error("Cluster upgrade job already exists for cluster id {}.", clusterId);
      throw new ConflictException("Cluster upgrade job already exists");
    }

    ElasticClient elasticClient =
        elasticsearchClientProvider.getElasticsearchClientByClusterId(clusterId);
    InfoResponse info = elasticClient.getClusterInfo();

    ClusterUpgradeJob clusterUpgradeJob = new ClusterUpgradeJob();
    clusterUpgradeJob.setClusterId(clusterId);
    clusterUpgradeJob.setTargetVersion(request.targetVersion());
    clusterUpgradeJob.setCurrentVersion(info.version().number());

    clusterUpgradeJobRepository.save(clusterUpgradeJob);

    return new CreateClusterUpgradeJobResponse("Cluster upgrade job created successfully",
        clusterUpgradeJob.getId());

  }

  public ClusterNodeUpgradeResponse upgradeNode(ClusterNodeUpgradeRequest request) {
    return new ClusterNodeUpgradeResponse("Node upgrade started");
  }
}
