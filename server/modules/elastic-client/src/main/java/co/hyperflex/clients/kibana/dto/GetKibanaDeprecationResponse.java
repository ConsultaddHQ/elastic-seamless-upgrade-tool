package co.hyperflex.clients.kibana.dto;

import java.util.List;

public record GetKibanaDeprecationResponse(
    List<Deprecation> deprecations
) {
  public record Deprecation(
      String configPath,
      String title,
      String level,
      String message,
      CorrectiveActions correctiveActions,
      String deprecationType,
      boolean requireRestart,
      String domainId
  ) {
  }

  public record CorrectiveActions(
      List<String> manualSteps
  ) {
  }
}