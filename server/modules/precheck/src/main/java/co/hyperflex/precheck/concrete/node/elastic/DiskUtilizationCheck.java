package co.hyperflex.precheck.concrete.node.elastic;

import co.hyperflex.clients.elastic.dto.nodes.ExtendedMemoryStats;
import co.hyperflex.core.models.enums.ClusterType;
import co.hyperflex.precheck.contexts.NodeContext;
import co.hyperflex.precheck.core.BaseElasticNodePrecheck;
import co.hyperflex.precheck.core.enums.PrecheckSeverity;
import org.springframework.stereotype.Component;

@Component
public class DiskUtilizationCheck extends BaseElasticNodePrecheck {
  @Override
  public String getName() {
    return "Disk Utilization Check";
  }

  @Override
  public PrecheckSeverity getSeverity(){
    return PrecheckSeverity.WARNING;
  }

  @Override
  public void run(NodeContext context) {
    try{
      var nodeId = context.getNode().getId();
      var logger = context.getLogger();

      var response = context.getElasticClient().getNodesMetric(nodeId, "stats/fs");

      var nodes = response.getNodes();
      var node = nodes.get(nodeId);

      if (node == null) {
        throw new RuntimeException("Node with ID [" + nodeId + "] not found");
      }

      var nodeName = node.getName();
      var fs = node.getFs();
      if (fs == null) {
        logger.info("{}: Skipping Disk Usage Check —  FS stats missing.", nodeName);
        return;
      }
      ExtendedMemoryStats mem = fs.getMem();

      if(mem != null){
        // Bundled or custom JVM
        long totalStorage = mem.getTotalInBytes();
        long availableStorage = mem.getFreeInBytes();
        long usedStorage = totalStorage - availableStorage;
        double usage = ((double)usedStorage/totalStorage)*100;
        logger.info("Disk Utilization Check Completed for node {}",nodeName);
        logger.info("Disk Utilized: {}%",String.format("%.2f", usage));
        logger.info("Available Storage : {} GB",String.format("%.2f", availableStorage/(double)1073741824));
        logger.info("Total Storage : {} GB",String.format("%.2f", totalStorage/(double)1073741824));
        if (usage >= 85) {
          context.getLogger().error("Disk Utilization exceeded the threshold of 85%");
          throw new RuntimeException();
        }

      }
      else {
        logger.info("{}: Skipping Disk Usage Check —   stats missing.", nodeName);
        return;
      }
    }
    catch(Exception e){
      context.getLogger().error("Disk Utilization check failed");
      context.getLogger().error(e.getMessage());
      throw new RuntimeException("Unable to run Disk Utilization check");
    }
  }

  public boolean shouldRun(NodeContext context) {
    return super.shouldRun(context) && context.getCluster().getType() == ClusterType.ELASTIC_CLOUD;
  }
}
