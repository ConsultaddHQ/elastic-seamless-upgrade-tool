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

}
