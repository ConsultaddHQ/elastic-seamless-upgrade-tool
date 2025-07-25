package co.hyperflex.dtos.clusters;

import co.hyperflex.entities.cluster.ClusterNodeType;
import co.hyperflex.entities.cluster.OperatingSystemInfo;
import co.hyperflex.entities.upgrade.NodeUpgradeStatus;
import java.util.List;

public record GetClusterNodeResponse(String id, String name, String ip, String version,
                                     List<String> roles, ClusterNodeType type, String clusterId,
                                     int progress, NodeUpgradeStatus status, OperatingSystemInfo os,
                                     boolean isActiveMaster) {
}

