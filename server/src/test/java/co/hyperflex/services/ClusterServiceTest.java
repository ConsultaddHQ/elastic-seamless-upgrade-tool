package co.hyperflex.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch.nodes.ElasticsearchNodesClient;
import co.elastic.clients.elasticsearch.nodes.NodesInfoRequest;
import co.elastic.clients.elasticsearch.nodes.NodesInfoResponse;
import co.hyperflex.clients.elastic.ElasticsearchClientProvider;
import co.hyperflex.clients.kibana.KibanaClient;
import co.hyperflex.clients.kibana.KibanaClientProvider;
import co.hyperflex.dtos.clusters.AddClusterResponse;
import co.hyperflex.dtos.clusters.AddSelfManagedClusterRequest;
import co.hyperflex.dtos.clusters.GetClusterResponse;
import co.hyperflex.dtos.clusters.UpdateClusterResponse;
import co.hyperflex.dtos.clusters.UpdateSelfManagedClusterRequest;
import co.hyperflex.entities.cluster.SelfManagedCluster;
import co.hyperflex.exceptions.BadRequestException;
import co.hyperflex.exceptions.NotFoundException;
import co.hyperflex.mappers.ClusterMapper;
import co.hyperflex.repositories.ClusterNodeRepository;
import co.hyperflex.repositories.ClusterRepository;
import java.io.IOException;
import java.util.Collections;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ClusterServiceTest {

  public static final String MOCK_ELASTIC_SEARCH_URL = "http://localhost.com:9200";
  public static final String MOCK_KIBANA_URL = "http://localhost.com:5601";
  @Mock
  private ClusterRepository clusterRepository;
  @Mock
  private ClusterNodeRepository clusterNodeRepository;
  @Mock
  private ClusterMapper clusterMapper;
  @Mock
  private ElasticsearchClientProvider elasticsearchClientProvider;
  @Mock
  private KibanaClientProvider kibanaClientProvider;
  @Mock
  private SshKeyService sshKeyService;

  @InjectMocks
  private ClusterService clusterService;

  @Test
  void add_selfManagedCluster_success() throws IOException {
    // Arrange
    AddSelfManagedClusterRequest request = new AddSelfManagedClusterRequest();
    request.setName("test-cluster");
    SelfManagedCluster cluster = new SelfManagedCluster();

    cluster.setName("test-cluster");
    cluster.setElasticUrl(MOCK_ELASTIC_SEARCH_URL);
    cluster.setKibanaUrl(MOCK_KIBANA_URL);

    co.hyperflex.clients.elastic.ElasticClient elasticClient = mock(co.hyperflex.clients.elastic.ElasticClient.class);
    KibanaClient kibanaClient = mock(KibanaClient.class);
    ElasticsearchClient esClient = mock(ElasticsearchClient.class);
    ElasticsearchNodesClient nodesClient = mock(ElasticsearchNodesClient.class);
    NodesInfoResponse nodesInfoResponse = mock(NodesInfoResponse.class);

    when(clusterMapper.toEntity(request)).thenReturn(cluster);
    when(elasticsearchClientProvider.getClient(cluster)).thenReturn(elasticClient);
    when(kibanaClientProvider.getClient(cluster)).thenReturn(kibanaClient);
    when(elasticClient.getHealthStatus()).thenReturn("green");
    when(kibanaClient.getKibanaVersion()).thenReturn("8.1.0");

    when(elasticClient.getElasticsearchClient()).thenReturn(esClient);
    when(esClient.nodes()).thenReturn(nodesClient);
    when(nodesClient.info(any(NodesInfoRequest.class))).thenReturn(nodesInfoResponse);
    when(nodesInfoResponse.nodes()).thenReturn(Collections.emptyMap());
    when(elasticClient.getActiveMasters()).thenReturn(Collections.emptyList());

    // Act
    AddClusterResponse response = clusterService.add(request);

    // Assert
    assertNotNull(response);
    verify(clusterRepository).save(cluster);
  }

  @Test
  void updateCluster_selfManagedCluster_success() throws IOException {
    // Arrange
    UpdateSelfManagedClusterRequest request = new UpdateSelfManagedClusterRequest();
    request.setName("updated-cluster");
    request.setElasticUrl(MOCK_ELASTIC_SEARCH_URL);
    request.setKibanaUrl(MOCK_KIBANA_URL);
    request.setSshKey("new-key");
    request.setSshUsername("new-user");

    String clusterId = "cluster-id";
    SelfManagedCluster cluster = new SelfManagedCluster();
    cluster.setId(clusterId);

    co.hyperflex.clients.elastic.ElasticClient elasticClient = mock(co.hyperflex.clients.elastic.ElasticClient.class);
    KibanaClient kibanaClient = mock(KibanaClient.class);
    ElasticsearchClient esClient = mock(ElasticsearchClient.class);
    ElasticsearchNodesClient nodesClient = mock(ElasticsearchNodesClient.class);
    NodesInfoResponse nodesInfoResponse = mock(NodesInfoResponse.class);

    when(clusterRepository.findById(clusterId)).thenReturn(Optional.of(cluster));
    when(sshKeyService.createSSHPrivateKeyFile(any(), any())).thenReturn("path/to/key");
    when(elasticsearchClientProvider.getClient(cluster)).thenReturn(elasticClient);
    when(kibanaClientProvider.getClient(cluster)).thenReturn(kibanaClient);
    when(elasticClient.getHealthStatus()).thenReturn("green");
    when(kibanaClient.getKibanaVersion()).thenReturn("8.1.0");

    when(elasticClient.getElasticsearchClient()).thenReturn(esClient);
    when(esClient.nodes()).thenReturn(nodesClient);
    when(nodesClient.info(any(NodesInfoRequest.class))).thenReturn(nodesInfoResponse);
    when(nodesInfoResponse.nodes()).thenReturn(Collections.emptyMap());
    when(elasticClient.getActiveMasters()).thenReturn(Collections.emptyList());

    // Act
    UpdateClusterResponse response = clusterService.updateCluster(clusterId, request);

    // Assert
    assertNotNull(response);
    verify(clusterRepository).save(cluster);
    assertEquals("updated-cluster", cluster.getName());
  }

  @Test
  void getClusterById_found() {
    // Arrange
    String clusterId = "cluster-id";
    SelfManagedCluster cluster = new SelfManagedCluster();
    cluster.setId(clusterId);
    GetClusterResponse getClusterResponse = mock(GetClusterResponse.class);

    when(clusterRepository.findById(clusterId)).thenReturn(Optional.of(cluster));
    when(clusterNodeRepository.findByClusterId(clusterId)).thenReturn(Collections.emptyList());
    when(clusterMapper.toGetClusterResponse(cluster, Collections.emptyList())).thenReturn(getClusterResponse);

    // Act
    GetClusterResponse response = clusterService.getClusterById(clusterId);

    // Assert
    assertNotNull(response);
    verify(clusterRepository).findById(clusterId);
  }

  @Test
  void getClusterById_notFound() {
    // Arrange
    String clusterId = "cluster-id";
    when(clusterRepository.findById(clusterId)).thenReturn(Optional.empty());

    // Act & Assert
    assertThrows(NotFoundException.class, () -> clusterService.getClusterById(clusterId));
  }

  @Test
  void add_invalidCredentials_throwsBadRequest() {
    // Arrange
    AddSelfManagedClusterRequest request = new AddSelfManagedClusterRequest();
    SelfManagedCluster cluster = new SelfManagedCluster();
    cluster.setElasticUrl(MOCK_ELASTIC_SEARCH_URL);
    cluster.setKibanaUrl(MOCK_KIBANA_URL);
    when(clusterMapper.toEntity(request)).thenReturn(cluster);
    when(elasticsearchClientProvider.getClient(cluster)).thenThrow(new RuntimeException("Invalid credentials"));

    // Act & Assert
    assertThrows(BadRequestException.class, () -> clusterService.add(request));
  }
}
