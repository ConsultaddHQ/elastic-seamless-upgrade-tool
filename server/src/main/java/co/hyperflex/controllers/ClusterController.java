package co.hyperflex.controllers;

import co.hyperflex.clients.elastic.dto.GetAllocationExplanationResponse;
import co.hyperflex.core.models.enums.ClusterNodeType;
import co.hyperflex.core.services.clusters.ClusterService;
import co.hyperflex.core.services.clusters.dtos.AddClusterRequest;
import co.hyperflex.core.services.clusters.dtos.AddClusterResponse;
import co.hyperflex.core.services.clusters.dtos.ClusterListItemResponse;
import co.hyperflex.core.services.clusters.dtos.ClusterOverviewResponse;
import co.hyperflex.core.services.clusters.dtos.GetClusterNodeResponse;
import co.hyperflex.core.services.clusters.dtos.GetClusterResponse;
import co.hyperflex.core.services.clusters.dtos.GetDeprecationsResponse;
import co.hyperflex.core.services.clusters.dtos.GetNodeConfigurationResponse;
import co.hyperflex.core.services.clusters.dtos.UpdateClusterRequest;
import co.hyperflex.core.services.clusters.dtos.UpdateClusterResponse;
import co.hyperflex.core.services.clusters.dtos.UpdateNodeConfigurationRequest;
import co.hyperflex.core.services.clusters.dtos.UpdateNodeConfigurationResponse;
import co.hyperflex.core.services.clusters.dtos.UploadCertificateResponse;
import co.hyperflex.core.services.deprecations.DeprecationService;
import co.hyperflex.services.CertificatesService;
import co.hyperflex.upgrade.services.NodeUpgradeService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/clusters")
public class ClusterController {

  private final ClusterService clusterService;
  private final CertificatesService certificatesService;
  private final DeprecationService deprecationService;
  private final NodeUpgradeService nodeUpgradeService;

  public ClusterController(ClusterService clusterService, CertificatesService certificatesService, DeprecationService deprecationService,
                           NodeUpgradeService nodeUpgradeService) {
    this.clusterService = clusterService;
    this.certificatesService = certificatesService;
    this.deprecationService = deprecationService;
    this.nodeUpgradeService = nodeUpgradeService;
  }

  @PostMapping
  public AddClusterResponse addCluster(@Valid @RequestBody AddClusterRequest request) {
    return clusterService.add(request);
  }

  @PutMapping("/{clusterId}")
  public UpdateClusterResponse updateCluster(@Valid @RequestBody UpdateClusterRequest request, @PathVariable String clusterId) {
    return clusterService.updateCluster(clusterId, request);
  }

  @GetMapping("")
  public List<ClusterListItemResponse> getClusters() {
    return clusterService.getClusters();
  }

  @GetMapping("/{clusterId}")
  public GetClusterResponse getCluster(@PathVariable String clusterId) {
    return clusterService.getClusterById(clusterId);
  }

  @GetMapping("/{clusterId}/nodes")
  public List<GetClusterNodeResponse> getClusterNodes(@PathVariable String clusterId,
                                                      @RequestParam(required = false) ClusterNodeType type) {
    return clusterService.getNodes(clusterId, type);
  }

  @GetMapping("/{clusterId}/nodes/{nodeId}/configuration")
  public GetNodeConfigurationResponse getNodeConfiguration(@PathVariable String clusterId, @PathVariable String nodeId) {
    return clusterService.getNodeConfiguration(clusterId, nodeId);
  }

  @PutMapping("/{clusterId}/nodes/{nodeId}/configuration")
  public UpdateNodeConfigurationResponse updateNodeConfiguration(
      @PathVariable String clusterId,
      @PathVariable String nodeId,
      @Valid @RequestBody UpdateNodeConfigurationRequest request) {
    var response = clusterService.updateNodeConfiguration(clusterId, nodeId, request.config());
    new Thread(() -> nodeUpgradeService.restartNode(clusterId, nodeId)).start();
    return response;
  }

  @PostMapping(value = "/certificates/upload", consumes = "multipart/form-data")
  public UploadCertificateResponse uploadCertificate(@RequestParam("files") MultipartFile[] files, @PathVariable String clusterId) {
    return certificatesService.uploadCertificate(files, clusterId);
  }

  @GetMapping("{clusterId}/overview")
  public ClusterOverviewResponse getClusterOverview(@PathVariable String clusterId) {
    return clusterService.getClusterOverview(clusterId);
  }


  @GetMapping("/{clusterId}/deprecations/kibana")
  public List<GetDeprecationsResponse> getDeprecations(@PathVariable String clusterId) {
    return deprecationService.getKibanaDeprecations(clusterId);
  }

  @GetMapping("/{clusterId}/deprecations/elastic-search")
  public List<GetDeprecationsResponse> getElasticDeprecations(@PathVariable String clusterId) {
    return deprecationService.getElasticDeprecations(clusterId);
  }

  @GetMapping("/{clusterId}/allocation-explanations")
  public List<GetAllocationExplanationResponse> getAllocationExplanation(@PathVariable String clusterId) {
    return clusterService.getAllocationExplanation(clusterId);
  }
}
