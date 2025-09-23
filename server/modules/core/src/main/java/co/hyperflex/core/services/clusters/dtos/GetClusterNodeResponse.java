package co.hyperflex.core.services.clusters.dtos;

import co.hyperflex.core.models.clusters.OperatingSystemInfo;
import co.hyperflex.core.models.enums.ClusterNodeType;
import co.hyperflex.core.models.enums.NodeUpgradeStatus;
import java.util.List;

public record GetClusterNodeResponse(String id, String name, String ip, String version,
                                     List<String> roles, ClusterNodeType type, String clusterId,
                                     int progress, NodeUpgradeStatus status, OperatingSystemInfo os,
                                     boolean isActiveMaster, boolean upgradable, int rank) {
}

