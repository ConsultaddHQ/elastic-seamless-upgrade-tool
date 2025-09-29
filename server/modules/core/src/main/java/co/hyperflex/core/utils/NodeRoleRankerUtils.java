package co.hyperflex.core.utils;

import co.hyperflex.core.models.enums.NodeRoles;
import java.util.List;

public class NodeRoleRankerUtils {

  public static int getNodeRankByRoles(List<String> nodeRoles, boolean isActiveMaster) {
    final List<String> roles = nodeRoles.stream()
        .map(String::toLowerCase)
        .toList();
    boolean isMaster = roles.contains(NodeRoles.MASTER);
    boolean isIngest = roles.contains(NodeRoles.INGEST);
    boolean isML = roles.contains(NodeRoles.ML);
    boolean isTransform = roles.contains(NodeRoles.TRANSFORM);
    boolean isRemote = roles.contains(NodeRoles.REMOTE_CLUSTER_CLIENT);
    boolean isKibana = roles.contains(NodeRoles.KIBANA);
    boolean isDataFrozen = roles.contains(NodeRoles.DATA_FROZEN);
    boolean isDataCold = roles.contains(NodeRoles.DATA_COLD);
    boolean isDataWarm = roles.contains(NodeRoles.DATA_WARM);
    boolean isDataHot = roles.contains(NodeRoles.DATA_HOT);
    boolean isDataContent = roles.contains(NodeRoles.DATA_CONTENT);
    boolean isGeneralData = roles.contains(NodeRoles.DATA);
    boolean isAnyData = isDataFrozen || isDataCold || isDataWarm || isDataHot || isDataContent || isGeneralData;
    if (isKibana) {
      return 200;
    }
    if (isActiveMaster) {
      return 150;
    }
    int rank = 0;

    if (isAnyData) {
      int dataScore = 7;
      if (isDataHot) {
        dataScore = 6;
      } else if (isDataContent) {
        dataScore = 5;
      } else if (isDataWarm) {
        dataScore = 4;
      } else if (isDataCold) {
        dataScore = 3;
      } else if (isDataFrozen) {
        dataScore = 2;
      }
      rank = 10 + dataScore;
    } else if (isMaster) {
      rank = 80;
    } else if (isML || isTransform || isRemote) {
      rank = 25;
    } else if (isIngest) {
      rank = 30;
    } else {
      rank = 50; // Coordinating-only
    }
    if (isMaster && isAnyData) {
      rank += 35;
    }
    return rank;
  }
}
