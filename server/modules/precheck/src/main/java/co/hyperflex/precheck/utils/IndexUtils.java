package co.hyperflex.precheck.utils;

import java.util.Map;

public class IndexUtils {
  private static final Map<String, Integer> esToLucene = Map.of("5", 6, "6", 7, "7", 8, "8", 9, "9", 10);

  public IndexUtils() {
  }

  public static int mapEsVersionToLucene(String elasticVersion) {
    String major = elasticVersion.substring(0, 1);
    return esToLucene.getOrDefault(major, -1);
  }
}
