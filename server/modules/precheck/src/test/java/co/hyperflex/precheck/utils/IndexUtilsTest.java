package co.hyperflex.precheck.utils;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import co.hyperflex.clients.elastic.ElasticClient;
import co.hyperflex.clients.elastic.ElasticsearchClientProvider;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class IndexUtilsTest {

  private final ObjectMapper mapper = new ObjectMapper();

  @Mock
  private ElasticsearchClientProvider elasticsearchClientProvider;

  @Mock
  private ElasticClient elasticClient;

  private IndexUtils indexUtils;

  @BeforeEach
  void setUp() {
    indexUtils = new IndexUtils(elasticsearchClientProvider);
  }

  // ------------------ mapEsVersionToLucene ------------------

  @Test
  void shouldMapEs7ToLucene8() {
    assertEquals(8, IndexUtils.mapEsVersionToLucene("7.10.2"));
  }

  @Test
  void shouldMapEs8ToLucene9() {
    assertEquals(9, IndexUtils.mapEsVersionToLucene("8.11.1"));
  }

  @Test
  void shouldReturnMinusOneForUnknownVersion() {
    assertEquals(-1, IndexUtils.mapEsVersionToLucene("4.2.0"));
  }

  // ------------------ isLuceneCompatible ------------------

  @Test
  void shouldReturnTrueWhenAllSegmentsAreNew() throws Exception {
    String json = """
        {
          "indices": {
            "test-index": {
              "shards": {
                "0": [
                  {
                    "segments": {
                      "_0": { "version": "8.9.0" }
                    }
                  }
                ]
              }
            }
          }
        }
        """;

    JsonNode response = mapper.readTree(json);

    when(elasticsearchClientProvider.getClient("cluster1"))
        .thenReturn(elasticClient);
    when(elasticClient.execute(any()))
        .thenReturn(response);

    assertTrue(indexUtils.isLuceneCompatible("cluster1", "test-index", 9));
  }


  @Test
  void shouldReturnFalseWhenAnySegmentIsOld() throws Exception {
    String json = """
        {
          "indices": {
            "test-index": {
              "shards": {
                "0": [
                  {
                    "segments": {
                      "_0": { "version": "7.6.0" }
                    }
                  }
                ]
              }
            }
          }
        }
        """;

    JsonNode response = mapper.readTree(json);

    when(elasticsearchClientProvider.getClient("cluster1"))
        .thenReturn(elasticClient);
    when(elasticClient.execute(any()))
        .thenReturn(response);

    assertFalse(indexUtils.isLuceneCompatible("cluster1", "test-index", 9));
  }

  @Test
  void shouldIgnoreEmptySegmentVersion() throws Exception {
    String json = """
        {
          "indices": {
            "test-index": {
              "shards": {
                "0": [
                  {
                    "segments": {
                      "_0": { "version": "" }
                    }
                  }
                ]
              }
            }
          }
        }
        """;

    JsonNode response = mapper.readTree(json);

    when(elasticsearchClientProvider.getClient("cluster1"))
        .thenReturn(elasticClient);
    when(elasticClient.execute(any()))
        .thenReturn(response);

    assertTrue(indexUtils.isLuceneCompatible("cluster1", "test-index", 9));
  }

  @Test
  void shouldReturnTrueWhenShardsAreMissing() throws Exception {
    String json = """
        {
          "indices": {
            "test-index": {}
          }
        }
        """;

    JsonNode response = mapper.readTree(json);

    when(elasticsearchClientProvider.getClient("cluster1"))
        .thenReturn(elasticClient);
    when(elasticClient.execute(any()))
        .thenReturn(response);

    assertTrue(indexUtils.isLuceneCompatible("cluster1", "test-index", 9));
  }

}
