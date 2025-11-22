package co.hyperflex.controllers;

import co.hyperflex.core.models.enums.ClusterNodeType;
import co.hyperflex.core.services.upgrade.dtos.ClusterNodeUpgradeRequest;
import co.hyperflex.core.services.upgrade.dtos.ClusterNodeUpgradeResponse;
import co.hyperflex.core.services.upgrade.dtos.ClusterUpgradeResponse;
import co.hyperflex.core.services.upgrade.dtos.GetUpgradeLogsRequest;
import co.hyperflex.core.services.upgrade.dtos.GetUpgradeLogsResponse;
import co.hyperflex.upgrade.services.ClusterUpgradeService;
import co.hyperflex.upgrade.services.UpgradeLogService;
import co.hyperflex.upgrade.services.dtos.ClusterInfoResponse;
import co.hyperflex.upgrade.services.dtos.NodeUpgradePlanResponse;
import java.util.Map;
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
                                                       @PathVariable String nodeId,
                                                       @RequestParam(name = "skipHealth", required = false, defaultValue = "false")
                                                       Boolean skipHealth) {
    return clusterUpgradeService.upgradeNode(new ClusterNodeUpgradeRequest(clusterId, nodeId), Map.of("skipHealth", skipHealth));
  }

  @GetMapping("/nodes/{nodeId}/plan")
  public NodeUpgradePlanResponse clusterNodeUpgradePlan(@PathVariable String clusterId,
                                                        @PathVariable String nodeId) {
    return clusterUpgradeService.clusterNodeUpgradePlan(clusterId, nodeId);
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
