package co.hyperflex.core.utils;

import java.util.Comparator;

public class VersionUtils {
  public static Comparator<String> VERSION_COMPARATOR = (v1, v2) -> {
    String[] partsA = v1.split("\\.");
    String[] partsB = v2.split("\\.");

    int maxLength = Math.max(partsA.length, partsB.length);
    for (int i = 0; i < maxLength; i++) {
      int version1 = i < partsA.length ? Integer.parseInt(partsA[i]) : 0;
      int version2 = i < partsB.length ? Integer.parseInt(partsB[i]) : 0;

      if (version1 != version2) {
        return Integer.compare(version1, version2);
      }
    }
    return 0;
  };

  public static boolean isVersionGte(String version1, String version2) {
    return VersionUtils.VERSION_COMPARATOR.compare(version2, version1) <= 0;
  }

  public static boolean isVersionGt(String version1, String version2) {
    return VersionUtils.VERSION_COMPARATOR.compare(version2, version1) < 0;
  }

  public static boolean isMajorVersionUpgrade(String currentVersion, String targetVersion) {
    return currentVersion.charAt(0) != targetVersion.charAt(0);
  }

  public static boolean isValidUpgrade(String currentVersion, String targetVersion) {
    boolean isCompatibleMajorVersionChange = (currentVersion.equals("7.17.28") && targetVersion.equals("8.0.0")) ||
        (currentVersion.equals("8.19.0") && targetVersion.equals("9.0.0"));
    int currentMajorVersion = Integer.parseInt(currentVersion.substring(0, currentVersion.indexOf('.')));
    int targetMajorVersion = Integer.parseInt(targetVersion.substring(0, targetVersion.indexOf('.')));
    return currentMajorVersion == targetMajorVersion || isCompatibleMajorVersionChange;
  }
}
