package co.hyperflex.core.utils;

import co.hyperflex.common.utils.VersionUtils;
import java.util.List;

public class UpgradePathUtils {

  private static final List<String> ELASTIC_VERSIONS = List.of(
      "7.0.0",
      "7.1.0",
      "7.2.0",
      "7.3.0",
      "7.4.0",
      "7.5.0",
      "7.6.0",
      "7.7.0",
      "7.8.1",
      "7.11.1",
      "7.12.1",
      "7.13.3",
      "7.13.4",
      "7.14.0",
      "7.14.1",
      "7.14.2",
      "7.15.0",
      "7.15.1",
      "7.15.2",
      "7.16.0",
      "7.16.1",
      "7.16.2",
      "7.16.3",
      "7.17.28",
      "8.0.0",
      "8.1.3",
      "8.2.3",
      "8.3.3",
      "8.4.3",
      "8.5.3",
      "8.6.2",
      "8.7.1",
      "8.8.2",
      "8.9.2",
      "8.10.4",
      "8.11.4",
      "8.12.2",
      "8.13.4",
      "8.14.3",
      "8.15.5",
      "8.16.4",
      "8.17.2",
      "8.18.2",
      "8.19.0",
      "9.0.0",
      "9.1.8",
      "9.2.2"
  );

  public static List<String> getPossibleUpgrades(String version) {
    if (version == null) {
      return List.of();
    }

    // Get upgrades greater than current version
    return ELASTIC_VERSIONS.stream()
        .filter(v -> VersionUtils.isVersionGt(v, version))
        .sorted(VersionUtils.VERSION_COMPARATOR.reversed()) // newest first
        .toList();
  }
}
