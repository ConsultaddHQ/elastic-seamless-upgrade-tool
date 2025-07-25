package co.hyperflex.controllers;

import co.hyperflex.dtos.clusters.AddClusterRequest;
import co.hyperflex.dtos.clusters.AddClusterResponse;
import co.hyperflex.dtos.clusters.GetClusterNodeResponse;
import co.hyperflex.dtos.clusters.GetClusterResponse;
import co.hyperflex.dtos.clusters.UpdateClusterRequest;
import co.hyperflex.dtos.clusters.UpdateClusterResponse;
import co.hyperflex.dtos.clusters.UploadCertificateResponse;
import co.hyperflex.entities.cluster.ClusterNodeType;
import co.hyperflex.services.CertificatesService;
import co.hyperflex.services.ClusterService;
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

  public ClusterController(ClusterService clusterService, CertificatesService certificatesService) {
    this.clusterService = clusterService;
    this.certificatesService = certificatesService;
  }

  @PostMapping
  public AddClusterResponse addCluster(@Valid @RequestBody AddClusterRequest request) {
    return clusterService.add(request);
  }

  @PutMapping("/{clusterId}")
  public UpdateClusterResponse updateCluster(@Valid @RequestBody UpdateClusterRequest request,
                                             @PathVariable String clusterId) {
    return clusterService.updateCluster(clusterId, request);
  }

  @GetMapping("")
  public List<GetClusterResponse> getClusters() {
    return clusterService.getClusters();
  }

  @GetMapping("/{clusterId}")
  public GetClusterResponse getCluster(@PathVariable String clusterId) {
    return clusterService.getClusterById(clusterId);
  }

  @GetMapping("/{clusterId}/nodes")
  public List<GetClusterNodeResponse> getClusterNodes(@PathVariable String clusterId,
                                                      @RequestParam(required = false)
                                                      ClusterNodeType type) {
    return clusterService.getNodes(clusterId, type);
  }

  @PostMapping(value = "/{clusterId}/upload", consumes = "multipart/form-data")
  public UploadCertificateResponse uploadCertificate(@RequestParam("files") MultipartFile[] files,
                                                     @PathVariable String clusterId) {
    return certificatesService.uploadCertificate(files, clusterId);
  }
}
