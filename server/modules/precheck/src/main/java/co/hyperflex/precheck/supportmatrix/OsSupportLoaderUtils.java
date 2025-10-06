package co.hyperflex.precheck.supportmatrix;

import co.hyperflex.core.models.enums.ClusterNodeType;
import java.io.IOException;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class OsSupportLoaderUtils {
  private static final Logger LOG = LoggerFactory.getLogger(OsSupportLoaderUtils.class);

  public static List<OsSupport> loadElasticOsSupports() {
    try {
      return new OsSupportLoader().load("prechecks/elastic-support-matrix.json");
    } catch (IOException e) {
      LOG.error("Failed to load elastic support matrix.", e);
      throw new RuntimeException(e);
    }
  }

  public static List<OsSupport> loadKibanaOsSupports() {
    try {
      return new OsSupportLoader().load("prechecks/kibana-support-matrix.json");
    } catch (IOException e) {
      LOG.error("Failed to load elastic support matrix.", e);
      throw new RuntimeException(e);
    }
  }

  public static List<OsSupport> loadOsSupports(ClusterNodeType clusterNodeType) {
    return clusterNodeType == ClusterNodeType.ELASTIC
        ? loadElasticOsSupports()
        : loadKibanaOsSupports();
  }
}
