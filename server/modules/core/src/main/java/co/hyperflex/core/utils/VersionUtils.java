package co.hyperflex.core.utils;

import java.time.LocalDate;
import java.util.Comparator;
import org.springframework.data.util.Pair;

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

  //Is version Greater considering out of order
  public static boolean isVersionGtConsideringOOO(Pair<String, LocalDate> version1, Pair<String, LocalDate> version2) {
    return VersionUtils.VERSION_COMPARATOR.compare(version2.getFirst(), version1.getFirst()) < 0
        && (version1.getSecond().isAfter(version2.getSecond())
        || version1.getSecond().isEqual(version2.getSecond()));
  }

  public static boolean isMajorVersionUpgrade(String currentVersion, String targetVersion) {
    return currentVersion.charAt(0) != targetVersion.charAt(0);
  }

  private static int getMajor(String version) {
    return Integer.parseInt(version.split("\\.")[0]);
  }

  private static int getMinor(String version) {
    return Integer.parseInt(version.split("\\.")[1]);
  }

  public static boolean isValidUpgrade(String currentVersion, String targetVersion) {

    int curMajor = VersionUtils.getMajor(currentVersion);
    int curMinor = VersionUtils.getMinor(currentVersion);
    int tgtMajor = VersionUtils.getMajor(targetVersion);
    int tgtMinor = VersionUtils.getMinor(targetVersion);

    // Same major upgrades are always allowed (**release-order already checked)
    if (curMajor == tgtMajor) {
      return true;
    }

    // 7.17.x -> 8.x
    if (curMajor == 7 && curMinor == 17 && tgtMajor == 8) {
      return true;
    }

    // 8.18.x -> 9.0.x ONLY
    if (curMajor == 8 && curMinor == 18 && tgtMajor == 9 && tgtMinor == 0) {
      return true;
    }

    // 8.19.x -> 9.1+
    if (curMajor == 8 && curMinor >= 19 && tgtMajor == 9 && tgtMinor >= 1) {
      return true;
    }

    return false;
  }


}
