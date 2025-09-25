package co.hyperflex.precheck.utils;


public class VersionUtils {
  private VersionUtils() {
  }

  // Parse version string into [major, minor, patch]
  private static int[] parse(String version) {
    String[] parts = version.split("\\.");
    int[] result = new int[3];
    for (int i = 0; i < result.length; i++) {
      if (i < parts.length && !"x".equals(parts[i])) {
        result[i] = Integer.parseInt(parts[i]);
      } else {
        result[i] = -1; // use -1 as wildcard
      }
    }
    return result;
  }

  // Compare full semantic versions
  public static int compare(String v1, String v2) {
    int[] p1 = parse(v1);
    int[] p2 = parse(v2);
    for (int i = 0; i < 3; i++) {
      int diff = p1[i] - p2[i];
      if (diff != 0) {
        return diff;
      }
    }
    return 0;
  }

  // Expand wildcard ranges
  private static String lowerBound(String version) {
    if (version == null) {
      return null;
    }
    return version.replace("x", "0");
  }

  private static String upperBound(String version) {
    if (version == null) {
      return null;
    }
    String[] parts = version.split("\\.");
    for (int i = parts.length - 1; i >= 0; i--) {
      if ("x".equals(parts[i])) {
        int prev = Integer.parseInt(parts[i - 1]);
        parts[i - 1] = String.valueOf(prev + 1);
        for (int j = i; j < parts.length; j++) {
          parts[j] = "0";
        }
        break;
      }
    }
    return String.join(".", parts);
  }

  // Check if target is in [start, end]
  public static boolean inRange(String target, String start, String end) {
    String t = target;

    String lower = start != null ? lowerBound(start) : null;
    String upper = end != null ? upperBound(end) : null;

    boolean afterStart = (lower == null) || compare(t, lower) >= 0;
    boolean beforeEnd = (upper == null) || compare(t, upper) < 0; // strict less than

    return afterStart && beforeEnd;
  }
}

