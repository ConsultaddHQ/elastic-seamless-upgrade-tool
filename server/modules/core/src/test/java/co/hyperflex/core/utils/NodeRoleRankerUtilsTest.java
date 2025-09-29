package co.hyperflex.core.utils;

import java.util.List;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

class NodeRoleRankerUtilsTest {

  @Test
  void testMasterEligibleAndDataRoleRank() {
    int rank = NodeRoleRankerUtils.getNodeRankByRoles(List.of("data", "master"), false);
    Assertions.assertEquals(52, rank);
  }

  @Test
  void testMasterRoleRank() {
    int rank = NodeRoleRankerUtils.getNodeRankByRoles(List.of("master"), true);
    Assertions.assertEquals(150, rank);
  }

  @Test
  void testKibanaRoleRank() {
    int rank = NodeRoleRankerUtils.getNodeRankByRoles(List.of("kibana"), false);
    Assertions.assertEquals(200, rank);
  }

  @Test
  void testMasterEligibleRoleRank() {
    int rank = NodeRoleRankerUtils.getNodeRankByRoles(List.of("master"), false);
    Assertions.assertEquals(80, rank);
  }

  @Test
  void testRealWorldUpgradeOrder() {
    // Simulating a real-world cluster with different node roles
    int kibanaRank = NodeRoleRankerUtils.getNodeRankByRoles(List.of("kibana"), false);
    int activeMasterRank = NodeRoleRankerUtils.getNodeRankByRoles(List.of("master"), true);
    int masterEligibleRank = NodeRoleRankerUtils.getNodeRankByRoles(List.of("master"), false);
    int masterEligibleDataWarmRank = NodeRoleRankerUtils.getNodeRankByRoles(List.of("master", "data_warm"), false);
    int masterEligibleDataRank = NodeRoleRankerUtils.getNodeRankByRoles(List.of("master", "data"), false);
    int dataHotRank = NodeRoleRankerUtils.getNodeRankByRoles(List.of("data_hot"), false);
    int dataWarmRank = NodeRoleRankerUtils.getNodeRankByRoles(List.of("data_warm"), false);
    int dataColdRank = NodeRoleRankerUtils.getNodeRankByRoles(List.of("data_cold"), false);
    int ingestRank = NodeRoleRankerUtils.getNodeRankByRoles(List.of("ingest"), false);
    int mlRank = NodeRoleRankerUtils.getNodeRankByRoles(List.of("ml"), false);
    int mlDataRank = NodeRoleRankerUtils.getNodeRankByRoles(List.of("ml", "data"), false);
    int coordinatingOnlyRank = NodeRoleRankerUtils.getNodeRankByRoles(List.of(), false);

    // Asserting the upgrade order based on ranks (higher rank = later upgrade)
    Assertions.assertTrue(kibanaRank > activeMasterRank);
    Assertions.assertTrue(activeMasterRank > masterEligibleRank);
    Assertions.assertTrue(masterEligibleRank > masterEligibleDataRank);
    Assertions.assertTrue(masterEligibleDataRank > coordinatingOnlyRank);
    Assertions.assertTrue(ingestRank > mlRank);
    Assertions.assertTrue(mlRank > mlDataRank);
    Assertions.assertTrue(mlDataRank > dataHotRank);
    Assertions.assertTrue(dataHotRank > dataWarmRank);
    Assertions.assertTrue(dataWarmRank > dataColdRank);
  }
}
