package co.hyperflex.precheck.concrete.node.elastic;

import co.hyperflex.core.models.clusters.Distro;
import co.hyperflex.core.models.enums.ClusterType;
import co.hyperflex.precheck.contexts.NodeContext;
import co.hyperflex.precheck.core.BaseElasticNodePrecheck;
import co.hyperflex.precheck.supportmatrix.OsSupport;
import co.hyperflex.precheck.supportmatrix.OsSupportLoaderUtils;
import co.hyperflex.precheck.utils.VersionUtils;
import org.springframework.stereotype.Component;

/**
 * Precheck that verifies whether the target Elasticsearch version
 * is supported on the current node's operating system according to
 * the official Elastic support matrix.
 *
 * <p>
 * - Checks both OS type and version.
 * - Checks if the target Elasticsearch version falls within a supported range.
 * - Logs informative messages and throws a RuntimeException if the version
 * or OS is unsupported.
 *
 * <p>
 * See: https://www.elastic.co/support/matrix
 */
@Component
public class ElasticSupportMatrixCheck extends BaseElasticNodePrecheck {

  @Override
  public String getName() {
    return "Elastic support matrix check";
  }

  @Override
  public boolean shouldRun(NodeContext context) {
    return super.shouldRun(context) && context.getCluster().getType() == ClusterType.SELF_MANAGED;
  }

  @Override
  public void run(NodeContext context) {
    var targetVersion = context.getClusterUpgradeJob().getTargetVersion();
    var distro = context.getNode().getOs().distro();
    var logger = context.getLogger();

    boolean osMatched = false;

    for (OsSupport osSupport : OsSupportLoaderUtils.loadElasticOsSupports()) {
      if (isSameOs(distro, osSupport) && isSameVersion(distro, osSupport)) {
        osMatched = true;
        for (var support : osSupport.supports()) {
          if (VersionUtils.inRange(targetVersion, support.start(), support.end())) {
            if (support.supported()) {
              logger.info("Elasticsearch version {} is supported on current node OS [{} {}]",
                  targetVersion, distro.name(), distro.version());
              return; // success, no need to check further
            } else {
              logger.error("Elasticsearch version {} is NOT supported on current node OS [{} {}]",
                  targetVersion, distro.name(), distro.version());
              throw new RuntimeException("Elasticsearch version not supported on node OS");
            }
          }
        }
      }
    }

    if (!osMatched) {
      logger.error("Current node OS [{} {}] is not listed in the Elastic support matrix.",
          distro.name(), distro.version());
    } else {
      logger.error("Unable to verify support for Elasticsearch version {} on current node OS [{} {}].",
          targetVersion, distro.name(), distro.version());
    }

    logger.info("Please visit https://www.elastic.co/support/matrix for details.");
    throw new RuntimeException("Elasticsearch version support could not be verified");
  }

  private boolean isSameVersion(Distro distro, OsSupport osSupport) {
    for (String s : distro.version().toLowerCase().split(" ")) {
      var va = s.split("\\.");
      var vb = osSupport.version().toLowerCase().split("\\.");
      var min = Math.min(va.length, vb.length);
      for (int i = 0; i < Math.min(va.length, vb.length); i++) {
        if (va[i].equals(vb[i])) {
          min--;
        } else {
          break;
        }
      }
      if (min == 0) {
        return true;
      }
    }
    return false;
  }

  private boolean isSameOs(Distro distro, OsSupport osSupport) {
    return distro.name().toLowerCase().contains(osSupport.os().toLowerCase());
  }

}
