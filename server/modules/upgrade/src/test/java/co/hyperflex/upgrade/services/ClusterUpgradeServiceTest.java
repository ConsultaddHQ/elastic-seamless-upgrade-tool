package co.hyperflex.upgrade.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

import co.hyperflex.clients.elastic.ElasticClient;
import co.hyperflex.clients.elastic.ElasticsearchClientProvider;
import co.hyperflex.clients.elastic.dto.GetElasticsearchSnapshotResponse;
import co.hyperflex.clients.kibana.KibanaClient;
import co.hyperflex.clients.kibana.KibanaClientProvider;
import co.hyperflex.core.models.enums.ClusterNodeType;
import co.hyperflex.core.models.enums.ClusterUpgradeStatus;
import co.hyperflex.core.repositories.ClusterNodeRepository;
import co.hyperflex.core.repositories.ClusterRepository;
import co.hyperflex.core.services.clusters.ClusterService;
import co.hyperflex.core.services.deprecations.DeprecationService;
import co.hyperflex.core.services.deprecations.dtos.DeprecationCounts;
import co.hyperflex.core.services.notifications.NotificationService;
import co.hyperflex.core.services.upgrade.ClusterUpgradeJobService;
import co.hyperflex.core.upgrade.ClusterUpgradeJobEntity;
import co.hyperflex.precheck.core.enums.PrecheckStatus;
import co.hyperflex.precheck.services.PrecheckRunService;
import co.hyperflex.upgrade.services.dtos.ClusterInfoResponse;
import java.util.Collections;
import java.util.Date;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ClusterUpgradeServiceTest {

  private static final String CLUSTER_ID = "test-cluster-id";
  @Mock
  private ElasticsearchClientProvider elasticsearchClientProvider;
  @Mock
  private ClusterNodeRepository clusterNodeRepository;
  @Mock
  private ClusterService clusterService;
  @Mock
  private ClusterRepository clusterRepository;
  @Mock
  private KibanaClientProvider kibanaClientProvider;
  @Mock
  private ClusterUpgradeJobService clusterUpgradeJobService;
  @Mock
  private NotificationService notificationService;
  @Mock
  private DeprecationService deprecationService;
  @Mock
  private PrecheckRunService precheckRunService;
  @Mock
  private ElasticClient elasticClient;
  @Mock
  private KibanaClient kibanaClient;
  @InjectMocks
  private ClusterUpgradeService clusterUpgradeService;
  private ClusterUpgradeJobEntity clusterUpgradeJob;
  private DeprecationCounts deprecationCounts;

  @BeforeEach
  void setUp() {
    clusterUpgradeJob = new ClusterUpgradeJobEntity();
    clusterUpgradeJob.setId("jobId");
    clusterUpgradeJob.setStatus(ClusterUpgradeStatus.PENDING);

    deprecationCounts = new DeprecationCounts(0, 0);

    // Common mocks for most tests
    when(elasticsearchClientProvider.getClient(CLUSTER_ID)).thenReturn(elasticClient);
    when(kibanaClientProvider.getClient(CLUSTER_ID)).thenReturn(kibanaClient);
    when(deprecationService.getKibanaDeprecationCounts(CLUSTER_ID)).thenReturn(deprecationCounts);
    when(deprecationService.getElasticDeprecationCounts(CLUSTER_ID)).thenReturn(deprecationCounts);
    when(kibanaClient.getSnapshotCreationPageUrl()).thenReturn("some-url");
  }

  @Nested
  @DisplayName("Initial State Scenarios")
  class InitialState {

    @Test
    @DisplayName("Should be upgradable when no nodes are upgraded and prechecks are complete")
    void upgradeInfo_when_prechecksCompleteAndNoNodesUpgraded_then_elasticIsUpgradable() {
      // Arrange
      when(clusterUpgradeJobService.getActiveJobByClusterId(CLUSTER_ID)).thenReturn(clusterUpgradeJob);
      when(precheckRunService.getStatusByUpgradeJobId(anyString())).thenReturn(PrecheckStatus.COMPLETED);
      when(elasticClient.getValidSnapshots()).thenReturn(List.of(new GetElasticsearchSnapshotResponse("snapshot", new Date())));
      when(clusterService.isNodesUpgraded(CLUSTER_ID, ClusterNodeType.ELASTIC)).thenReturn(false);
      when(clusterService.isNodesUpgraded(CLUSTER_ID, ClusterNodeType.KIBANA)).thenReturn(false);

      // Act
      ClusterInfoResponse response = clusterUpgradeService.upgradeInfo(CLUSTER_ID);

      // Assert
      assertNotNull(response);
      assertEquals(PrecheckStatus.COMPLETED, response.precheck().status());
      assertTrue(response.elastic().isUpgradable());
      assertFalse(response.kibana().isUpgradable());
      assertNotNull(response.elastic().snapshot().snapshot());
    }

    @Test
    @DisplayName("Should show failed precheck status correctly")
    void upgradeInfo_when_prechecksFailed_then_showFailedStatus() {
      // Arrange
      when(clusterUpgradeJobService.getActiveJobByClusterId(CLUSTER_ID)).thenReturn(clusterUpgradeJob);
      when(precheckRunService.getStatusByUpgradeJobId(anyString())).thenReturn(PrecheckStatus.FAILED);
      when(elasticClient.getValidSnapshots()).thenReturn(Collections.emptyList());

      // Act
      ClusterInfoResponse response = clusterUpgradeService.upgradeInfo(CLUSTER_ID);

      // Assert
      assertEquals(PrecheckStatus.FAILED, response.precheck().status());
    }
  }

  @Nested
  @DisplayName("Upgrade Progress Scenarios")
  class UpgradeProgress {

    @Test
    @DisplayName("Should make Kibana upgradable after all Elastic nodes are upgraded")
    void upgradeInfo_when_elasticNodesAreUpgraded_then_kibanaIsUpgradable() {
      // Arrange
      when(clusterUpgradeJobService.getActiveJobByClusterId(CLUSTER_ID)).thenReturn(clusterUpgradeJob);
      when(precheckRunService.getStatusByUpgradeJobId(anyString())).thenReturn(PrecheckStatus.COMPLETED);
      when(elasticClient.getValidSnapshots()).thenReturn(Collections.emptyList());
      when(clusterService.isNodesUpgraded(CLUSTER_ID, ClusterNodeType.ELASTIC)).thenReturn(true);
      when(clusterService.isNodesUpgraded(CLUSTER_ID, ClusterNodeType.KIBANA)).thenReturn(false);

      // Act
      ClusterInfoResponse response = clusterUpgradeService.upgradeInfo(CLUSTER_ID);

      // Assert
      assertFalse(response.elastic().isUpgradable());
      assertTrue(response.kibana().isUpgradable());
    }

    @Test
    @DisplayName("Should show nothing is upgradable when all nodes are upgraded")
    void upgradeInfo_when_allNodesAreUpgraded_then_nothingIsUpgradable() {
      // Arrange
      when(clusterUpgradeJobService.getActiveJobByClusterId(CLUSTER_ID)).thenReturn(clusterUpgradeJob);
      when(precheckRunService.getStatusByUpgradeJobId(anyString())).thenReturn(PrecheckStatus.COMPLETED);
      when(elasticClient.getValidSnapshots()).thenReturn(Collections.emptyList());
      when(clusterService.isNodesUpgraded(CLUSTER_ID, ClusterNodeType.ELASTIC)).thenReturn(true);
      when(clusterService.isNodesUpgraded(CLUSTER_ID, ClusterNodeType.KIBANA)).thenReturn(true);

      // Act
      ClusterInfoResponse response = clusterUpgradeService.upgradeInfo(CLUSTER_ID);

      // Assert
      assertFalse(response.elastic().isUpgradable());
      assertFalse(response.kibana().isUpgradable());
    }

    @Test
    @DisplayName("Should show nothing is upgradable when job status is UPDATED")
    void upgradeInfo_when_jobStatusIsUpdated_then_nothingIsUpgradable() {
      // Arrange
      clusterUpgradeJob.setStatus(ClusterUpgradeStatus.UPDATED);
      when(clusterUpgradeJobService.getActiveJobByClusterId(CLUSTER_ID)).thenReturn(clusterUpgradeJob);
      when(precheckRunService.getStatusByUpgradeJobId(anyString())).thenReturn(PrecheckStatus.COMPLETED);
      when(elasticClient.getValidSnapshots()).thenReturn(Collections.emptyList());

      // Act
      ClusterInfoResponse response = clusterUpgradeService.upgradeInfo(CLUSTER_ID);

      // Assert
      assertFalse(response.elastic().isUpgradable());
      assertFalse(response.kibana().isUpgradable());
    }

    @Test
    @DisplayName("Precheck runs are marked COMPLETED once upgrade starts, regardless of result")
    void upgradeInfo_when_jobStatusIsUpdating_then_precheckIsCompleted() {
      // Arrange
      clusterUpgradeJob.setStatus(ClusterUpgradeStatus.UPGRADING);
      when(clusterUpgradeJobService.getActiveJobByClusterId(CLUSTER_ID)).thenReturn(clusterUpgradeJob);
      when(elasticClient.getValidSnapshots()).thenReturn(Collections.emptyList());
      when(clusterService.isNodesUpgraded(CLUSTER_ID, ClusterNodeType.ELASTIC)).thenReturn(false);

      // Act
      ClusterInfoResponse response = clusterUpgradeService.upgradeInfo(CLUSTER_ID);

      // Assert
      assertTrue(response.elastic().isUpgradable());
      assertFalse(response.kibana().isUpgradable());
      assertEquals(PrecheckStatus.COMPLETED, response.precheck().status());
    }
  }

  @Nested
  @DisplayName("Edge Case Scenarios")
  class EdgeCases {

    @Test
    @DisplayName("Should handle cases with no active upgrade job")
    void upgradeInfo_when_noActiveJob_then_prechecksAreCompleted() {
      // Arrange
      when(clusterUpgradeJobService.getActiveJobByClusterId(CLUSTER_ID)).thenThrow(new RuntimeException("No active job"));
      when(elasticClient.getValidSnapshots()).thenReturn(Collections.emptyList());

      // Act
      ClusterInfoResponse response = clusterUpgradeService.upgradeInfo(CLUSTER_ID);

      // Assert
      assertNotNull(response);
      assertEquals(PrecheckStatus.COMPLETED, response.precheck().status());
      // isUpgradable is true because isClusterUpgraded is false and isNodesUpgraded is false by default
      assertTrue(response.elastic().isUpgradable());
      assertFalse(response.kibana().isUpgradable());
    }
  }
}