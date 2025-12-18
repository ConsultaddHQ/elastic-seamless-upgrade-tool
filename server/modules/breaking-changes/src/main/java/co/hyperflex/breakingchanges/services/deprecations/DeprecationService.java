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

  public DeprecationService(ElasticsearchClientProvider elasticsearchClientProvider,
                            KibanaClientProvider kibanaClientProvider) {
    this.elasticsearchClientProvider = elasticsearchClientProvider;
    this.kibanaClientProvider = kibanaClientProvider;
  }

  public List<GetDeprecationsResponse> getKibanaDeprecations(String clusterId) {
    try {
      KibanaClient kibanaClient = kibanaClientProvider.getClient(clusterId);
      List<GetKibanaDeprecationResponse.Deprecation> deprecations =
          Optional.ofNullable(kibanaClient.getDeprecations()).map(GetKibanaDeprecationResponse::deprecations).orElse(new LinkedList<>());
      return deprecations.stream().map((item) -> new GetDeprecationsResponse(
          Optional.ofNullable(item.title()).orElse("unknown"),
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

    GetElasticDeprecationResponse deprecation = elasticClient.getDeprecation();
    List<GetDeprecationsResponse> responses = new LinkedList<>();
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
          (s, deprecations1) -> processMigrationDeprecations(deprecations1, responses));
    });
    Optional.ofNullable(deprecation.dataStreams()).ifPresent(deprecations -> {
      deprecations.forEach(
          (s, deprecations1) -> processMigrationDeprecations(deprecations1, responses));
    });
    Optional.ofNullable(deprecation.ilmPolicies()).ifPresent(deprecations -> {
      deprecations.forEach(
          (s, deprecations1) -> processMigrationDeprecations(deprecations1, responses));
    });
    Optional.ofNullable(deprecation.templates()).ifPresent(deprecations -> {
      deprecations.forEach(
          (s, deprecations1) -> processMigrationDeprecations(deprecations1, responses));
    });
    return responses;
  }

  private void processMigrationDeprecations(List<ElasticDeprecation> deprecations,
                                            List<GetDeprecationsResponse> responses) {
    if (deprecations != null) {
      deprecations.forEach((item) -> {
        responses.add(new GetDeprecationsResponse(
            item.message(),
            item.details(),
            item.level(),
            List.of(Optional.ofNullable(item.url()).orElse(""))
        ));
      });
    }
  }

}