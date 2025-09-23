package co.hyperflex.core.models.enums;

import jakarta.validation.constraints.NotNull;

public enum PackageManager {
  APT,     // Debian/Ubuntu
  DNF,     // RHEL/Rocky/Alma
  YUM;

  public static PackageManager fromBuildType(@NotNull String buildType) {
    return switch (buildType.toUpperCase()) {
      case "DEB" -> APT;
      case "RPM" -> DNF;
      default -> null;
    };
  }
}

