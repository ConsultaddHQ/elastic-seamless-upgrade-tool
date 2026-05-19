package co.hyperflex.breakingchanges.services.deprecations;

import co.hyperflex.breakingchanges.services.deprecations.dtos.DeprecationCounts;
import co.hyperflex.breakingchanges.services.deprecations.dtos.GetDeprecationsResponse;
import co.hyperflex.clients.elastic.ElasticClient;
import co.hyperflex.clients.elastic.ElasticsearchClientProvider;
import co.hyperflex.clients.elastic.dto.ElasticDeprecation;
import co.hyperflex.clients.elastic.dto.GetElasticDeprecationResponse;
import co.hyperflex.clients.kibana.KibanaClient;
import co.hyperflex.clients.kibana.KibanaClientProvider;
import co.hyperflex.clients.kibana.dto.GetKibanaDeprecationResponse;
import co.hyperflex.core.services.upgrade.ClusterUpgradeJobService;
import co.hyperflex.core.upgrade.ClusterUpgradeJobEntity;
import java.util.Collections;
import java.util.LinkedList;
import java.util.List;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class DeprecationService {
  private static final Logger log = LoggerFactory.getLogger(DeprecationService.class);
  private final ElasticsearchClientProvider elasticsearchClientProvider;
  private final KibanaClientProvider kibanaClientProvider;
  private final ClusterUpgradeJobService clusterUpgradeJobService;

  public DeprecationService(ElasticsearchClientProvider elasticsearchClientProvider,
                            KibanaClientProvider kibanaClientProvider, ClusterUpgradeJobService clusterUpgradeJobService) {
    this.elasticsearchClientProvider = elasticsearchClientProvider;
    this.kibanaClientProvider = kibanaClientProvider;
    this.clusterUpgradeJobService = clusterUpgradeJobService;
  }

  public List<GetDeprecationsResponse> getKibanaDeprecations(String clusterId) {
    try {
      KibanaClient kibanaClient = kibanaClientProvider.getClient(clusterId);
      List<GetKibanaDeprecationResponse.Deprecation> deprecations =
          Optional.ofNullable(kibanaClient.getDeprecations()).map(GetKibanaDeprecationResponse::deprecations).orElse(new LinkedList<>());
      return deprecations.stream().map((item) -> new GetDeprecationsResponse(
          Optional.ofNullable(item.title()).orElse("unknown"),
          null,
          item.message(),
          item.level(),
          Optional.ofNullable(item.correctiveActions().manualSteps()).orElse(List.of("Check docs"))
      )).toList();
    } catch (Exception e) {
      return Collections.emptyList();
    }
  }

  public DeprecationCounts getKibanaDeprecationCounts(String clusterId) {
    return this.getDeprecationCounts(getKibanaDeprecations(clusterId));
  }

  public DeprecationCounts getElasticDeprecationCounts(String clusterId) {
    return this.getDeprecationCounts(getElasticDeprecations(clusterId));
  }

  private DeprecationCounts getDeprecationCounts(List<GetDeprecationsResponse> deprecations) {
    int critical = 0;
    int warning = 0;
    for (GetDeprecationsResponse deprecation : deprecations) {
      if ("critical".equals(deprecation.type())) {
        critical++;
      } else if ("warning".equals(deprecation.type())) {
        warning++;
      }
    }
    return new DeprecationCounts(critical, warning);
  }

  public List<GetDeprecationsResponse> getElasticDeprecations(String clusterId) {
    ElasticClient elasticClient =
        elasticsearchClientProvider.getClient(clusterId);
    List<GetDeprecationsResponse> responses = new LinkedList<>();

    ClusterUpgradeJobEntity job = clusterUpgradeJobService.getActiveJobByClusterId(clusterId);

    String currentVersion = job.getCurrentVersion();
    String targetVersion = job.getTargetVersion();

    Integer currentMajor = getMajorVersion(currentVersion);
    Integer targetMajor = getMajorVersion(targetVersion);

    // Reindexing Is Required at the time of Major Version jumps only
    // by default Elastic Deprecation api, consider the next major version
    if (currentMajor + 1 != targetMajor) {
      return responses;
    }

    GetElasticDeprecationResponse deprecation = elasticClient.getDeprecation();
    Optional.ofNullable(deprecation.clusterSettings()).ifPresent(deprecations -> {
      processMigrationDeprecations(deprecations, responses);
    });
    Optional.ofNullable(deprecation.mlSettings()).ifPresent(deprecations -> {
      processMigrationDeprecations(deprecations, responses);
    });
    Optional.ofNullable(deprecation.nodeSettings()).ifPresent(deprecations -> {
      processMigrationDeprecations(deprecations, responses);
    });
    Optional.ofNullable(deprecation.indexSettings()).ifPresent(deprecations -> {
      deprecations.forEach(
          (s, deprecations1) -> processMigrationDeprecations(s, deprecations1, responses));
    });
    Optional.ofNullable(deprecation.dataStreams()).ifPresent(deprecations -> {
      deprecations.forEach(
          (s, deprecations1) -> processMigrationDeprecations(s, deprecations1, responses));
    });
    Optional.ofNullable(deprecation.ilmPolicies()).ifPresent(deprecations -> {
      deprecations.forEach(
          (s, deprecations1) -> processMigrationDeprecations(s, deprecations1, responses));
    });
    Optional.ofNullable(deprecation.templates()).ifPresent(deprecations -> {
      deprecations.forEach(
          (s, deprecations1) -> processMigrationDeprecations(s, deprecations1, responses));
    });
    return responses;
  }

  private void processMigrationDeprecations(List<ElasticDeprecation> deprecations,
                                            List<GetDeprecationsResponse> responses) {
    processMigrationDeprecations(null, deprecations, responses);
  }

  private void processMigrationDeprecations(String name, List<ElasticDeprecation> deprecations,
                                            List<GetDeprecationsResponse> responses) {
    if (deprecations != null) {
      deprecations.forEach((item) -> {
        responses.add(new GetDeprecationsResponse(
            item.message(),
            name,
            item.details(),
            item.level(),
            List.of(Optional.ofNullable(item.url()).orElse(""))
        ));
      });
    }
  }

  private Integer getMajorVersion(String version) {
    String major = version.split("\\.")[0];
    return Integer.parseInt(major);
  }
}