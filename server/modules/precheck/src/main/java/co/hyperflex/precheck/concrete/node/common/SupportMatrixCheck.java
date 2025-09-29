package co.hyperflex.precheck.concrete.node.common;

import co.hyperflex.core.models.clusters.Distro;
import co.hyperflex.core.models.enums.ClusterNodeType;
import co.hyperflex.core.models.enums.ClusterType;
import co.hyperflex.precheck.contexts.NodeContext;
import co.hyperflex.precheck.core.BaseNodePrecheck;
import co.hyperflex.precheck.core.PrecheckFailedException;
import co.hyperflex.precheck.supportmatrix.OsSupport;
import co.hyperflex.precheck.supportmatrix.OsSupportLoaderUtils;
import co.hyperflex.precheck.utils.VersionUtils;
import org.springframework.stereotype.Component;

/**
 * Precheck that verifies whether the target Elasticsearch/Kibana version
 * is supported on the current node's operating system according to
 * the official Elastic support matrix.
 *
 * <p>
 * - Checks both OS type and version.
 * - Checks if the target Elasticsearch/Kibana version falls within a supported range.
 * - Logs informative messages and throws a RuntimeException if the version
 * or OS is unsupported.
 *
 * <p>
 * See: https://www.elastic.co/support/matrix
 */
@Component
public class SupportMatrixCheck extends BaseNodePrecheck {

  @Override
  public String getName() {
    return "Support matrix check";
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
    var node = context.getNode();
    var nodeLabel = node.getType() == ClusterNodeType.ELASTIC ? "Elasticsearch" : "Kibana";

    logger.info("Please visit https://www.elastic.co/support/matrix for details.");

    for (OsSupport osSupport : OsSupportLoaderUtils.loadOsSupports(context.getNode().getType())) {
      if (isSameOs(distro, osSupport) && isSameVersion(distro, osSupport)) {
        for (var support : osSupport.supports()) {
          if (VersionUtils.inRange(targetVersion, support.start(), support.end())) {
            if (support.supported()) {
              logger.info("{} version {} is supported on current node OS [{} {}]",
                  nodeLabel, targetVersion, distro.name(), distro.version());
              return; // success, no need to check further
            } else {
              logger.error("{} version {} is unsupported on current node OS [{} {}]",
                  nodeLabel, targetVersion, distro.name(), distro.version());
              throw new PrecheckFailedException();
            }
          }
        }
      }
    }

    logger.error("Unable to verify support for {} version {} on current node OS [{} {}].",
        nodeLabel, targetVersion, distro.name(), distro.version());

    logger.error("{} version support could not be verified", nodeLabel);
    throw new PrecheckFailedException();
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
