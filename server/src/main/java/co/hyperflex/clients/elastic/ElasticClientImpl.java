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
import com.fasterxml.jackson.databind.ObjectMapper;
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
  private final ObjectMapper objectMapper;

  public ElasticClientImpl(RestApiClient apiClient, ObjectMapper objectMapper) {
    super(apiClient);
    this.restClient = apiClient.getRestClient();
    this.objectMapper = objectMapper;
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
      ResponseEntity<String> repoResponseString = restClient.get()
          .uri("/_snapshot")
          .retrieve()
          .toEntity(String.class);

      JsonNode repoResult = objectMapper.readTree(repoResponseString.getBody());
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
              ResponseEntity<String> snapshotResponse = restClient.get()
                  .uri("/_snapshot/{repo}/_all", repository)
                  .retrieve()
                  .toEntity(String.class);

              JsonNode body = objectMapper.readTree(snapshotResponse.getBody());
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
      return new GetAllocationExplanationResponse(
          shard.getIndex(),
          shard.getShard() + (isPrimaryShard ? "(primary)" : ""),
          data.get("allocate_explanation").toString()
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
