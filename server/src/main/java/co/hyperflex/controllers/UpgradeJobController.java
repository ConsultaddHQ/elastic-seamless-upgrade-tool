package co.hyperflex.controllers;

import co.hyperflex.core.services.upgrade.ClusterUpgradeJobService;
import co.hyperflex.core.services.upgrade.dtos.CreateClusterUpgradeJobRequest;
import co.hyperflex.core.services.upgrade.dtos.CreateClusterUpgradeJobResponse;
import co.hyperflex.core.services.upgrade.dtos.GetTargetVersionResponse;
import co.hyperflex.core.services.upgrade.dtos.GetUpgradeJobStatusResponse;
import co.hyperflex.core.services.upgrade.dtos.StopClusterUpgradeResponse;
import co.hyperflex.upgrade.services.NodeUpgradeService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/clusters/{clusterId}/upgrades/jobs")
public class UpgradeJobController {
  private static final Logger logger = LoggerFactory.getLogger(UpgradeJobController.class);

  @Autowired
  private final NodeUpgradeService nodeUpgradeService;
  private final ClusterUpgradeJobService clusterUpgradeJobService;

  public UpgradeJobController(NodeUpgradeService nodeUpgradeService, ClusterUpgradeJobService clusterUpgradeJobService) {
    this.nodeUpgradeService = nodeUpgradeService;
    this.clusterUpgradeJobService = clusterUpgradeJobService;
  }

  @PostMapping()
  public CreateClusterUpgradeJobResponse clusterUpgradeJob(@Valid @RequestBody CreateClusterUpgradeJobRequest request,
                                                           @PathVariable String clusterId) {
    return clusterUpgradeJobService.createClusterUpgradeJob(clusterId, request);
  }

  @GetMapping("/target-version")
  public GetTargetVersionResponse getTargetVersionInfo(@PathVariable String clusterId) {
    return clusterUpgradeJobService.getTargetVersionInfo(clusterId);
  }

  @GetMapping("/status")
  public GetUpgradeJobStatusResponse getUpgradeJobStatusResponse(@PathVariable String clusterId) {
    return clusterUpgradeJobService.getUpgradeJobStatus(clusterId);
  }

  @GetMapping("/{nodeId}/test")
  public String runAnsibleCommand(@PathVariable String clusterId, @PathVariable String nodeId) {
    nodeUpgradeService.restartNode(clusterId, nodeId);
    return clusterId;
  }


  @PutMapping("/stop")
  public StopClusterUpgradeResponse stopClusterUpgrade(@PathVariable String clusterId) {
    return clusterUpgradeJobService.stopClusterUpgrade(clusterId);
  }

}

