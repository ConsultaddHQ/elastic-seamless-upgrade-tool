package co.hyperflex.controllers;

import co.hyperflex.dtos.ClusterInfoResponse;
import co.hyperflex.dtos.upgrades.ClusterNodeUpgradeRequest;
import co.hyperflex.dtos.upgrades.ClusterNodeUpgradeResponse;
import co.hyperflex.dtos.upgrades.ClusterUpgradeResponse;
import co.hyperflex.dtos.upgrades.GetUpgradeLogsRequest;
import co.hyperflex.dtos.upgrades.GetUpgradeLogsResponse;
import co.hyperflex.entities.cluster.ClusterNodeType;
import co.hyperflex.services.ClusterUpgradeService;
import co.hyperflex.services.UpgradeLogService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/clusters/{clusterId}/upgrades")
public class UpgradeController {
  private static final Logger logger = LoggerFactory.getLogger(UpgradeController.class);
  private final ClusterUpgradeService clusterUpgradeService;
  private final UpgradeLogService upgradeLogService;

  public UpgradeController(ClusterUpgradeService clusterUpgradeService,
                           UpgradeLogService upgradeLogService) {
    this.clusterUpgradeService = clusterUpgradeService;
    this.upgradeLogService = upgradeLogService;
  }

  @PostMapping()
  public ClusterUpgradeResponse clusterUpgrade(@PathVariable String clusterId, @RequestParam ClusterNodeType nodeType) {
    return clusterUpgradeService.upgrade(clusterId, nodeType);
  }

  @PostMapping("/nodes/{nodeId}")
  public ClusterNodeUpgradeResponse clusterNodeUpgrade(@PathVariable String clusterId,
                                                       @PathVariable String nodeId) {
    return clusterUpgradeService.upgradeNode(new ClusterNodeUpgradeRequest(clusterId, nodeId));
  }

  @GetMapping("/info")
  public ClusterInfoResponse clusterInfo(@PathVariable String clusterId) {
    return clusterUpgradeService.upgradeInfo(clusterId);
  }

  @GetMapping("/nodes/{nodeId}/logs")
  public GetUpgradeLogsResponse clusterUpgradeLogs(@PathVariable String clusterId, @PathVariable String nodeId) {
    return upgradeLogService.getLogs(new GetUpgradeLogsRequest(clusterId, nodeId));
  }

}
