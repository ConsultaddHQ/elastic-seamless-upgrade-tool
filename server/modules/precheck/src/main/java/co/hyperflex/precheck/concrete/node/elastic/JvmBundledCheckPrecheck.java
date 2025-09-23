package co.hyperflex.precheck.concrete.node.elastic;

import co.hyperflex.precheck.contexts.NodeContext;
import co.hyperflex.precheck.core.BaseElasticNodePrecheck;
import co.hyperflex.precheck.core.enums.PrecheckSeverity;
import org.springframework.stereotype.Component;

@Component
public class JvmBundledCheckPrecheck extends BaseElasticNodePrecheck {

  @Override
  public String getName() {
    return "JVM Distribution (Bundled/Custom) Check";
  }

  @Override
  public PrecheckSeverity getSeverity() {
    return PrecheckSeverity.INFO;
  }

  @Override
  public void run(NodeContext context) {
    var nodeId = context.getNode().getId();
    var logger = context.getLogger();

    // Fetch JVM info via Nodes Info API
    var response = context.getElasticClient().getNodesMetric(nodeId, "jvm");

    var nodes = response.getNodes();
    var node = nodes.get(nodeId);

    if (node == null) {
      throw new RuntimeException("Node with ID [" + nodeId + "] not found");
    }

    var nodeName = node.getName();
    var jvm = node.getJvm();
    if (jvm == null) {
      logger.info("{}: Skipping bundled JVM check — JVM info missing.", nodeName);
      return;
    }

    // Bundled or custom JVM
    var usingBundledJdk = jvm.getUsingBundledJdk();

    if (usingBundledJdk != null && usingBundledJdk) {
      String version = jvm.getVmVersion();
      String vmName = jvm.getVmName();
      String vmVendor = jvm.getVmVendor();
      logger.info("{}: Node is using bundled JDK [{} {} - {}].", nodeName, version, vmName, vmVendor);
    } else {
      logger.info("{}: Node is using custom JVM.", nodeName);
    }
  }
}
