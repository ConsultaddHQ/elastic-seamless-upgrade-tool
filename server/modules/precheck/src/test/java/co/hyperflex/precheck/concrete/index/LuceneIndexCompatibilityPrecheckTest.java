package co.hyperflex.precheck.concrete.index;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import co.hyperflex.clients.elastic.ElasticClient;
import co.hyperflex.clients.kibana.KibanaClient;
import co.hyperflex.core.entites.clusters.ClusterEntity;
import co.hyperflex.core.upgrade.ClusterUpgradeJobEntity;
import co.hyperflex.precheck.contexts.IndexContext;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.slf4j.Logger;

@ExtendWith(MockitoExtension.class)
class LuceneIndexCompatibilityPrecheckTest {

  @Mock
  ClusterEntity clusterEntity;
  @Mock
  KibanaClient kibanaClient;
  @Mock
  ClusterUpgradeJobEntity clusterUpgradeJobEntity;
  @Mock
  Logger logger;
  String index = "test-index";
  String segmentResponse = """
      {
         "_shards": {
           "total": 2,
           "successful": 2,
           "failed": 0
         },
         "indices": {
           "test-index": {
             "shards": {
               "0": [
                 {
                   "routing": {
                     "state": "STARTED",
                     "primary": true,
                     "node": "OaOSfNUCQHKq83sUpJRLjg"
                   },
                   "num_committed_segments": 1,
                   "num_search_segments": 1,
                   "segments": {
                     "_0": {
                       "generation": 0,
                       "num_docs": 1,
                       "deleted_docs": 0,
                       "size_in_bytes": 3709,
                       "committed": true,
                       "search": true,
                       "version": "8.9.0",
                       "compound": true,
                       "attributes": {
                         "Lucene87StoredFieldsFormat.mode": "BEST_SPEED"
                       }
                     }
                   }
                 },
                 {
                   "routing": {
                     "state": "STARTED",
                     "primary": false,
                     "node": "FpolASo7TISnKb8G4WDsaQ"
                   },
                   "num_committed_segments": 1,
                   "num_search_segments": 1,
                   "segments": {
                     "_0": {
                       "generation": 0,
                       "num_docs": 1,
                       "deleted_docs": 0,
                       "size_in_bytes": 3709,
                       "committed": true,
                       "search": true,
                       "version": "8.9.0",
                       "compound": true,
                       "attributes": {
                         "Lucene87StoredFieldsFormat.mode": "BEST_SPEED"
                       }
                     }
                   }
                 }
               ]
             }
           }
         }
       }
      """;
  @InjectMocks
  private LuceneIndexCompatibilityPrecheck precheck;
  @Mock
  private ElasticClient elasticClient;

  @Spy
  private ObjectMapper objectMapper = new ObjectMapper();

  @Test
  void shouldPass() {
    IndexContext context = new IndexContext(clusterEntity, elasticClient, kibanaClient, index, clusterUpgradeJobEntity, logger);
    when(clusterUpgradeJobEntity.getTargetVersion()).thenReturn("7.0.0");
    when(elasticClient.execute(any())).thenReturn(segmentResponse);
    Assertions.assertDoesNotThrow(() -> precheck.run(context));
  }

  @Test
  void shouldPass1() {
    IndexContext context = new IndexContext(clusterEntity, elasticClient, kibanaClient, index, clusterUpgradeJobEntity, logger);
    when(clusterUpgradeJobEntity.getTargetVersion()).thenReturn("8.0.0");
    when(elasticClient.execute(any())).thenReturn(segmentResponse);
    Assertions.assertDoesNotThrow(() -> precheck.run(context));
  }


  @Test
  void shouldFail() {
    IndexContext context = new IndexContext(clusterEntity, elasticClient, kibanaClient, index, clusterUpgradeJobEntity, logger);
    when(clusterUpgradeJobEntity.getTargetVersion()).thenReturn("9.0.0");
    when(elasticClient.execute(any())).thenReturn(segmentResponse);
    Assertions.assertThrows(Exception.class, () -> precheck.run(context));
  }
}