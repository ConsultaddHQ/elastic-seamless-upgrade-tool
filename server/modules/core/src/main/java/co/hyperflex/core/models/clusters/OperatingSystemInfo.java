package co.hyperflex.core.models.clusters;

import co.hyperflex.core.models.enums.PackageManager;

public record OperatingSystemInfo(String name,
                                  String version,
                                  Distro distro,
                                  PackageManager packageManager) {
}
