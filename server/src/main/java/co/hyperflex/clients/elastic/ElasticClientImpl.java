package co.hyperflex.clients.elastic;

import co.hyperflex.clients.RestApiClient;
import co.hyperflex.clients.elastic.dto.GetAllocationExplanationResponse;
import co.hyperflex.clients.elastic.dto.GetElasticDeprecationResponse;
import co.hyperflex.clients.elastic.dto.GetElasticsearchSnapshotResponse;
import co.hyperflex.clients.elastic.dto.cat.health.HealthRecord;
import co.hyperflex.clients.elastic.dto.cat.indices.IndicesRecord;
import co.hyperflex.clients.elastic.dto.cat.master.MasterRecord;
import co.hyperflex.clients.elastic.dto.cat.shards.ShardsRecord;
import com.fasterxml.jackson.databind.JsonNode;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Stream;
import java.util.stream.StreamSupport;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestClient;

public class ElasticClientImpl extends AbstractElasticClient {
  private static final Logger LOG = LoggerFactory.getLogger(ElasticClientImpl.class);
  private final RestClient restClient;

  public ElasticClientImpl(RestApiClient apiClient) {
    super(apiClient);
    this.restClient = apiClient.getRestClient();
  }

  @Override
  public List<HealthRecord> getHealth() {
    String uri = "/_cat/health?format=json";
    return restClient.get().uri(uri).retrieve().body(new ParameterizedTypeReference<>() {
    });
  }

  @Override
  public List<IndicesRecord> getIndices() {
    var uri = "/_cat/indices?format=json";
    return restClient.get().uri(uri).retrieve().body(new ParameterizedTypeReference<>() {
    });
  }

  @Override
  public List<MasterRecord> getActiveMasters() {
    var uri = "/_cat/master?v&format=json";
    return restClient.get().uri(uri).retrieve().body(new ParameterizedTypeReference<>() {
    });
  }

  @Override
  public List<GetElasticsearchSnapshotResponse> getValidSnapshots(String version) {
    try {
      ResponseEntity<JsonNode> repoResponse = restClient.get()
          .uri("/_snapshot")
          .retrieve()
          .toEntity(JsonNode.class);

      JsonNode repoResult = repoResponse.getBody();
      if (repoResult == null || repoResult.isEmpty()) {
        return Collections.emptyList();
      }

      Set<String> repositories = new HashSet<>();
      repoResult.fieldNames().forEachRemaining(repositories::add);

      if (repositories.isEmpty()) {
        return Collections.emptyList();
      }

      long now = System.currentTimeMillis();
      long twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;

      List<GetElasticsearchSnapshotResponse> allValidSnapshots =
          repositories.stream().parallel().flatMap(repository -> {
            try {
              ResponseEntity<JsonNode> snapshotResponse = restClient.get()
                  .uri("/_snapshot/{repo}/_all", repository)
                  .retrieve()
                  .toEntity(JsonNode.class);

              JsonNode body = snapshotResponse.getBody();
              if (body == null || !body.has("snapshots")) {
                return Stream.empty();
              }

              JsonNode snapshots = body.get("snapshots");
              return StreamSupport.stream(snapshots.spliterator(), false)
                  .filter(s -> s.has("start_time_in_millis"))
                  .filter(s -> {
                    long time = s.get("start_time_in_millis").asLong();
                    return time >= twentyFourHoursAgo && time <= now;
                  })
                  .map(s -> new GetElasticsearchSnapshotResponse(
                      s.get("snapshot").asText(),
                      new Date(s.get("start_time_in_millis").asLong())
                  ));
            } catch (Exception e) {
              LOG.error("Error fetching snapshots for repository {}: {}", repository, e.getMessage(), e);
              return Stream.empty();
            }
          }).toList();

      if (allValidSnapshots.isEmpty()) {
        LOG.info("No valid snapshots found within the last 24 hours.");
      }

      return allValidSnapshots;

    } catch (Exception e) {
      LOG.error("Error checking snapshot details:", e);
      throw new RuntimeException("Failed to get valid snapshots", e);
    }
  }


  @Override
  public GetElasticDeprecationResponse getDeprecation() {
    return restClient.get().uri("/_migration/deprecations").retrieve().body(GetElasticDeprecationResponse.class);
  }

  @Override
  public List<GetAllocationExplanationResponse> getAllocationExplanation() {
    String unassigned = "UNASSIGNED";
    List<ShardsRecord> shards = getShards();

    return shards.stream().filter(s -> unassigned.equals(s.getState())).map(shard -> {
      boolean isPrimaryShard = "p".equals(shard.getPrirep());
      var body = "{\"index\":\"" + shard.getIndex() + "\",\"shard\":" + shard.getShard() + ",\"primary\":" + isPrimaryShard + "}";
      Map data = restClient.post().uri("/_cluster/allocation/explain").body(body).retrieve().body(Map.class);

      List<String> fullExplanation = new ArrayList<>();
      Set<String> deciderSet = new HashSet<>();

      List<Map<String, Object>> nodeDecisions = (List<Map<String, Object>>) data.get("node_allocation_decisions");

      if (nodeDecisions != null) {
        for (Map<String, Object> node : nodeDecisions) {
          List<Map<String, Object>> deciders = (List<Map<String, Object>>) node.get("deciders");
          if (deciders != null) {
            for (Map<String, Object> decider : deciders) {
              // Only add deciders that explicitly said "NO"
              if ("NO".equals(decider.get("decision"))) {
                fullExplanation.add((String) decider.get("explanation"));
                deciderSet.add((String) decider.get("decider"));
              }
            }
          }
        }
      }

      return new GetAllocationExplanationResponse(
          shard.getIndex(),
          shard.getShard() + (isPrimaryShard ? "(primary)" : ""),
          data.get("allocate_explanation").toString(),
          deciderSet,
          fullExplanation
      );
    }).toList();
  }


  @Override
  public List<ShardsRecord> getShards(String indexName) {
    String uri = "/_cat/shards/" + indexName + "?format=json";
    return restClient.get().uri(uri).retrieve().body(new ParameterizedTypeReference<>() {
    });
  }
}
