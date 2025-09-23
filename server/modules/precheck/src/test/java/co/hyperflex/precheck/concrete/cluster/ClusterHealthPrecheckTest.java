package co.hyperflex.precheck.concrete.cluster;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import co.hyperflex.clients.elastic.ElasticClient;
import co.hyperflex.precheck.contexts.ClusterContext;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.slf4j.Logger;

@ExtendWith(MockitoExtension.class)
class ClusterHealthPrecheckTest {

  @Mock
  private ClusterContext context;
  @Mock
  private ElasticClient elasticClient;
  @Mock
  private Logger logger;

  @InjectMocks
  private ClusterHealthPrecheck precheck;

  @Test
  void run_whenClusterIsHealthy_shouldPass() {
    when(context.getElasticClient()).thenReturn(elasticClient);
    when(context.getLogger()).thenReturn(logger);
    when(elasticClient.getHealthStatus()).thenReturn("green");

    assertDoesNotThrow(() -> precheck.run(context));
  }

  @Test
  void run_whenClusterIsNotHealthy_shouldThrowException() {
    when(context.getElasticClient()).thenReturn(elasticClient);
    when(context.getLogger()).thenReturn(logger);
    when(elasticClient.getHealthStatus()).thenReturn("red");

    assertThrows(RuntimeException.class, () -> precheck.run(context));
  }

  @Test
  void run_whenHealthCheckFails_shouldThrowException() {
    when(context.getElasticClient()).thenReturn(elasticClient);
    when(context.getLogger()).thenReturn(logger);
    when(elasticClient.getHealthStatus()).thenThrow(new RuntimeException("API error"));

    assertThrows(RuntimeException.class, () -> precheck.run(context));
  }
}
