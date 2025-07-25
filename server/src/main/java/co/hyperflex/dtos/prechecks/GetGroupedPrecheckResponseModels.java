package co.hyperflex.dtos.prechecks;

import co.hyperflex.entities.precheck.PrecheckStatus;
import java.util.List;

public class GetGroupedPrecheckResponseModels {

  public record GetGroupedPrecheckResponse(
      List<GetNodePrecheckGroup> node,
      List<GetClusterPrecheckEntry> cluster,
      List<GetIndexPrecheckGroup> index,
      List<GetBreakingChangeEntry> breakingChanges
  ) {
  }

  public record GetNodePrecheckGroup(
      String nodeId,
      String ip,
      String name,
      PrecheckStatus status,
      List<GetPrecheckEntry> prechecks
  ) {
  }

  public record GetIndexPrecheckGroup(
      String index,
      String name,
      PrecheckStatus status,
      List<GetPrecheckEntry> prechecks
  ) {
  }

  public record GetPrecheckEntry(
      String id,
      String name,
      PrecheckStatus status,
      List<String> logs,
      double duration
  ) {
  }

  public record GetBreakingChangeEntry(
      String id,
      String name,
      List<String> logs,
      PrecheckStatus status
  ) {
  }

  public record GetClusterPrecheckEntry(
      String id,
      String name,
      PrecheckStatus status,
      List<String> logs,
      double duration
  ) {
  }
}