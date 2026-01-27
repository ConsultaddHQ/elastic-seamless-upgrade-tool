package co.hyperflex.upgrade.services.dtos;

import co.hyperflex.core.models.enums.NodeUpgradeStatus;
import java.util.List;

public record NodeUpgradePlanResponse(List<Task> plan) {
  public record Task(String id, String name, NodeUpgradeStatus status) {
  }
}
