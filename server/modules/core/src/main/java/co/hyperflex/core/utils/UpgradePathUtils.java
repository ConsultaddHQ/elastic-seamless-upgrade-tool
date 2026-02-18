package co.hyperflex.core.utils;

import java.text.SimpleDateFormat;
import java.time.LocalDate;
import java.util.Date;
import java.util.List;
import org.springframework.data.util.Pair;

public class UpgradePathUtils {

  private static final SimpleDateFormat df = new SimpleDateFormat("yyyy-MM-dd");
  private static final LocalDate LEGACY_DATE = LocalDate.of(1900, 1, 1);


  private static final List<Pair<String, LocalDate>> ELASTIC_VERSIONS =
      List.of(Pair.of("7.0.0", LEGACY_DATE), Pair.of("7.1.0", LEGACY_DATE), Pair.of("7.2.0", LEGACY_DATE), Pair.of("7.3.0", LEGACY_DATE),
          Pair.of("7.4.0", LEGACY_DATE), Pair.of("7.5.0", LEGACY_DATE), Pair.of("7.6.0", LEGACY_DATE), Pair.of("7.7.0", LEGACY_DATE),
          Pair.of("7.8.1", LEGACY_DATE), Pair.of("7.11.1", LEGACY_DATE), Pair.of("7.12.1", LEGACY_DATE), Pair.of("7.13.3", LEGACY_DATE),
          Pair.of("7.13.4", LEGACY_DATE), Pair.of("7.14.0", LEGACY_DATE), Pair.of("7.14.1", LEGACY_DATE), Pair.of("7.14.2", LEGACY_DATE),
          Pair.of("7.15.0", LEGACY_DATE), Pair.of("7.15.1", LEGACY_DATE), Pair.of("7.15.2", LEGACY_DATE), Pair.of("7.16.0", LEGACY_DATE),
          Pair.of("7.16.1", LEGACY_DATE), Pair.of("7.16.2", LEGACY_DATE), Pair.of("7.16.3", LEGACY_DATE), Pair.of("7.17.28", LEGACY_DATE),
          // ---- 8.x (real release dates) ----
          Pair.of("8.0.0", LocalDate.of(2022, 2, 10)), Pair.of("8.1.3", LocalDate.of(2022, 4, 4)),
          Pair.of("8.2.3", LocalDate.of(2022, 5, 26)), Pair.of("8.3.3", LocalDate.of(2022, 6, 28)),
          Pair.of("8.4.3", LocalDate.of(2022, 8, 24)), Pair.of("8.5.3", LocalDate.of(2022, 11, 15)),
          Pair.of("8.6.2", LocalDate.of(2023, 1, 10)), Pair.of("8.7.1", LocalDate.of(2023, 5, 2)),
          Pair.of("8.8.2", LocalDate.of(2023, 5, 25)), Pair.of("8.9.2", LocalDate.of(2023, 7, 26)),
          Pair.of("8.10.4", LocalDate.of(2023, 9, 12)), Pair.of("8.11.4", LocalDate.of(2024, 1, 25)),
          Pair.of("8.12.2", LocalDate.of(2024, 2, 6)), Pair.of("8.13.4", LocalDate.of(2024, 4, 3)),
          Pair.of("8.14.3", LocalDate.of(2024, 6, 6)), Pair.of("8.15.5", LocalDate.of(2024, 8, 13)),
          Pair.of("8.16.4", LocalDate.of(2024, 11, 12)), Pair.of("8.17.2", LocalDate.of(2025, 1, 15)),
          Pair.of("8.18.2", LocalDate.of(2025, 4, 15)), Pair.of("8.19.0", LocalDate.of(2025, 7, 29)),
          // ---- 9.x ----
          Pair.of("9.0.0", LocalDate.of(2025, 4, 15)), Pair.of("9.1.8", LocalDate.of(2025, 8, 7)),
          Pair.of("9.2.2", LocalDate.of(2025, 10, 29)));

  private static Date parseDate(String s) {
    try {
      return df.parse(s);
    } catch (Exception e) {
      return null;
    }
  }

  public static List<String> getPossibleUpgrades(String version) {
    if (version == null) {
      return List.of();
    }
    Pair<String, LocalDate> currentVersion = ELASTIC_VERSIONS.stream().filter(p -> p.getFirst().equals(version)).findFirst().orElse(null);
    if (currentVersion == null) {
      //start with 7.x but not present in ELASTIC_VERSIONS List
      if (version.startsWith("7.")) {
        currentVersion = Pair.of(version, LEGACY_DATE);
      } else {
        //start with 8.x or 9.x but not present in ELASTIC_VERSIONS List
        LocalDate miniDate = null;
        for (int i = 0; i < ELASTIC_VERSIONS.size(); i++) {
          if (VersionUtils.isVersionGt(ELASTIC_VERSIONS.get(i).getFirst(), version)) {
            //Take the previous Date (i-1)
            miniDate = ELASTIC_VERSIONS.get(i - 1).getSecond();
            break;
          }
        }
        currentVersion = Pair.of(version, miniDate);
      }
    }
    Pair<String, LocalDate> finalCurrentVersion = currentVersion;
    return ELASTIC_VERSIONS.stream()
        .filter(v -> VersionUtils.isVersionGtConsideringOOO(v, finalCurrentVersion))
        .sorted((v1, v2) -> VersionUtils.VERSION_COMPARATOR.compare(v2.getFirst(), v1.getFirst())).map(Pair::getFirst).toList();
  }
}
