package co.hyperflex.core.services.deprecations;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

import co.hyperflex.clients.elastic.ElasticClient;
import co.hyperflex.clients.elastic.ElasticsearchClientProvider;
import co.hyperflex.clients.elastic.dto.ElasticDeprecation;
import co.hyperflex.clients.elastic.dto.GetElasticDeprecationResponse;
import co.hyperflex.clients.kibana.KibanaClient;
import co.hyperflex.clients.kibana.KibanaClientProvider;
import co.hyperflex.clients.kibana.dto.GetKibanaDeprecationResponse;
import co.hyperflex.core.services.clusters.dtos.GetDeprecationsResponse;
import co.hyperflex.core.services.deprecations.dtos.DeprecationCounts;
import java.util.Collections;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class DeprecationServiceTest {

  private static final String CLUSTER_ID = "test-cluster";
  @Mock
  private ElasticsearchClientProvider elasticsearchClientProvider;
  @Mock
  private KibanaClientProvider kibanaClientProvider;
  @Mock
  private ElasticClient elasticClient;
  @Mock
  private KibanaClient kibanaClient;
  @InjectMocks
  private DeprecationService deprecationService;

  @Test
  void getKibanaDeprecations_returnsCorrectly() {
    // Arrange
    when(kibanaClientProvider.getClient(CLUSTER_ID)).thenReturn(kibanaClient);
    GetKibanaDeprecationResponse.Deprecation deprecation = new GetKibanaDeprecationResponse.Deprecation(
        "config.path", "Title", "warning", "Message",
        new GetKibanaDeprecationResponse.CorrectiveActions(List.of("Step 1")),
        "deprecation_type", false, "domain_id");
    GetKibanaDeprecationResponse kibanaResponse = new GetKibanaDeprecationResponse(List.of(deprecation));
    when(kibanaClient.getDeprecations()).thenReturn(kibanaResponse);

    // Act
    List<GetDeprecationsResponse> result = deprecationService.getKibanaDeprecations(CLUSTER_ID);

    // Assert
    assertEquals(1, result.size());
    assertEquals("Title", result.get(0).issue());
    assertEquals("Message", result.get(0).issueDetails());
    assertEquals("warning", result.get(0).type());
    assertEquals(List.of("Step 1"), result.get(0).resolutions());
  }

  @Test
  void getElasticDeprecations_returnsCorrectly() {
    // Arrange
    when(elasticsearchClientProvider.getClient(CLUSTER_ID)).thenReturn(elasticClient);
    ElasticDeprecation deprecation = new ElasticDeprecation("Details", "critical", "Message", "URL");
    GetElasticDeprecationResponse elasticResponse = new GetElasticDeprecationResponse(
        List.of(deprecation), Collections.emptyMap(), Collections.emptyMap(), Collections.emptyList(),
        Collections.emptyList(), Collections.emptyMap(), Collections.emptyMap());
    when(elasticClient.getDeprecation()).thenReturn(elasticResponse);

    // Act
    List<GetDeprecationsResponse> result = deprecationService.getElasticDeprecations(CLUSTER_ID);

    // Assert
    assertEquals(1, result.size());
    assertEquals("Message", result.get(0).issue());
    assertEquals("Details", result.get(0).issueDetails());
    assertEquals("critical", result.get(0).type());
    assertEquals(List.of("URL"), result.get(0).resolutions());
  }

  @Test
  void getKibanaDeprecationCounts_returnsCorrectCounts() {
    // Arrange
    when(kibanaClientProvider.getClient(CLUSTER_ID)).thenReturn(kibanaClient);
    GetKibanaDeprecationResponse.Deprecation critical = new GetKibanaDeprecationResponse.Deprecation(
        null, null, "critical", null, new GetKibanaDeprecationResponse.CorrectiveActions(List.of()), "critical", false, null);
    GetKibanaDeprecationResponse.Deprecation warning = new GetKibanaDeprecationResponse.Deprecation(
        null, null, "warning", null, new GetKibanaDeprecationResponse.CorrectiveActions(List.of()), "warning", false, null);
    GetKibanaDeprecationResponse kibanaResponse = new GetKibanaDeprecationResponse(List.of(critical, warning, warning));
    when(kibanaClient.getDeprecations()).thenReturn(kibanaResponse);

    // Act
    DeprecationCounts counts = deprecationService.getKibanaDeprecationCounts(CLUSTER_ID);

    // Assert
    assertEquals(1, counts.critical());
    assertEquals(2, counts.warning());
  }

  @Test
  void getElasticDeprecationCounts_returnsCorrectCounts() {
    // Arrange
    when(elasticsearchClientProvider.getClient(CLUSTER_ID)).thenReturn(elasticClient);
    ElasticDeprecation critical = new ElasticDeprecation(null, "critical", null, null);
    ElasticDeprecation warning = new ElasticDeprecation(null, "warning", null, null);
    GetElasticDeprecationResponse elasticResponse = new GetElasticDeprecationResponse(
        List.of(critical, warning, warning), Collections.emptyMap(), Collections.emptyMap(), Collections.emptyList(),
        Collections.emptyList(), Collections.emptyMap(), Collections.emptyMap());
    when(elasticClient.getDeprecation()).thenReturn(elasticResponse);

    // Act
    DeprecationCounts counts = deprecationService.getElasticDeprecationCounts(CLUSTER_ID);

    // Assert
    assertEquals(1, counts.critical());
    assertEquals(2, counts.warning());
  }
}
