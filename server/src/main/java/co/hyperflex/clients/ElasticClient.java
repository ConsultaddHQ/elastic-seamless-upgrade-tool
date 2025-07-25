package co.hyperflex.clients;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch.core.InfoResponse;
import co.elastic.clients.elasticsearch.indices.ElasticsearchIndicesClient;
import co.elastic.clients.elasticsearch.indices.GetIndexRequest;
import co.elastic.clients.elasticsearch.indices.GetIndexResponse;
import java.io.IOException;
import java.util.List;

public class ElasticClient {
  private final ElasticsearchClient elasticsearchClient;

  public ElasticClient(ElasticsearchClient elasticsearchClient) {
    this.elasticsearchClient = elasticsearchClient;
  }

  public ElasticsearchClient getElasticsearchClient() {
    return elasticsearchClient;
  }

  public List<String> getIndices() {
    ElasticsearchIndicesClient indices = elasticsearchClient.indices();
    GetIndexRequest request = GetIndexRequest.of(b -> b.index("*"));

    try {
      GetIndexResponse response = indices.get(request);
      return response.result()
          .keySet()
          .stream()
          .filter(indexState -> !indexState.startsWith("."))
          .toList();
    } catch (IOException e) {
      throw new RuntimeException(e);
    }
  }

  public InfoResponse getClusterInfo() {
    try {
      return getElasticsearchClient().info();
    } catch (IOException e) {
      throw new RuntimeException(e);
    }
  }
}
