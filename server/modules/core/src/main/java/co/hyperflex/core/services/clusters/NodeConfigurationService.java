package co.hyperflex.core.services.clusters;

import co.hyperflex.common.exceptions.BadRequestException;
import co.hyperflex.core.entites.clusters.ClusterEntity;
import co.hyperflex.core.entites.clusters.SelfManagedClusterEntity;
import co.hyperflex.core.entites.clusters.nodes.ClusterNodeEntity;
import co.hyperflex.core.entites.clusters.nodes.ElasticNodeEntity;
import co.hyperflex.core.repositories.ClusterNodeRepository;
import co.hyperflex.core.repositories.ClusterRepository;
import co.hyperflex.core.services.clusters.dtos.GetNodeConfigurationResponse;
import co.hyperflex.core.services.clusters.dtos.UpdateNodeConfigurationResponse;
import co.hyperflex.ssh.CommandResult;
import co.hyperflex.ssh.SshCommandExecutor;
import co.hyperflex.ssh.SudoBecome;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class NodeConfigurationService {

  private static final Logger log = LoggerFactory.getLogger(NodeConfigurationService.class);
  private final ClusterRepository clusterRepository;
  private final ClusterNodeRepository clusterNodeRepository;

  public NodeConfigurationService(ClusterRepository clusterRepository, ClusterNodeRepository clusterNodeRepository) {
    this.clusterRepository = clusterRepository;
    this.clusterNodeRepository = clusterNodeRepository;
  }

  private static String getNodeConfigFilePath(ClusterNodeEntity clusterNode) {
    return (clusterNode instanceof ElasticNodeEntity) ? "/etc/elasticsearch/elasticsearch.yml" : "/etc/kibana/kibana.yml";
  }

  public GetNodeConfigurationResponse getNodeConfiguration(String clusterId, String nodeId) {
    ClusterEntity cluster = clusterRepository.findById(clusterId).orElseThrow();
    if (!(cluster instanceof SelfManagedClusterEntity selfManagedCluster)) {
      throw new BadRequestException("This operation is not supported for cluster type: " + cluster.getType().getDisplayName());
    }
    try {
      ClusterNodeEntity clusterNode = clusterNodeRepository.findById(nodeId).orElseThrow();
      String configFilePath = getNodeConfigFilePath(clusterNode);
      var configCommand = "sudo cat " + configFilePath;
      var sshInfo = selfManagedCluster.getSshInfo();
      try (var executor = new SshCommandExecutor(clusterNode.getIp(),
          22,
          sshInfo.username(),
          sshInfo.keyPath(),
          new SudoBecome(sshInfo.becomeUser()))) {
        CommandResult result = executor.execute(configCommand);
        if (result.isSuccess()) {
          return new GetNodeConfigurationResponse(result.stdout());
        } else {
          throw new RuntimeException(result.stderr());
        }
      }
    } catch (Exception e) {
      throw new BadRequestException("Failed to get node yml config file");
    }
  }

  public UpdateNodeConfigurationResponse updateNodeConfiguration(String clusterId, String nodeId, String nodeConfiguration) {
    try {
      ClusterEntity cluster = clusterRepository.findById(clusterId).orElseThrow();
      if (!(cluster instanceof SelfManagedClusterEntity selfManagedCluster)) {
        throw new BadRequestException("This operation is not supported for cluster type: " + cluster.getType().getDisplayName());
      }
      ClusterNodeEntity clusterNode = clusterNodeRepository.findById(nodeId).orElseThrow();
      String configFilePath = getNodeConfigFilePath(clusterNode);

      var sshInfo = selfManagedCluster.getSshInfo();
      try (var executor = new SshCommandExecutor(clusterNode.getIp(),
          22,
          sshInfo.username(),
          sshInfo.keyPath(),
          new SudoBecome(sshInfo.becomeUser()))) {
        // Write the new config to the file (overwrites existing)
        String updateCommand = String.format("echo '%s' | sudo tee %s", escapeSingleQuotes(nodeConfiguration), configFilePath);
        CommandResult updateResult = executor.execute(updateCommand);
        if (!updateResult.isSuccess()) {
          throw new RuntimeException("Failed to update config: " + updateResult.stderr());
        }
        return new UpdateNodeConfigurationResponse("Node configuration updated successfully. Node is restarting...");
      }
    } catch (Exception e) {
      log.error("Failed to update node configuration for clusterId: {}", clusterId, e);
      throw new BadRequestException("Failed to update node config");
    }
  }

  private String escapeSingleQuotes(String input) {
    return input.replace("'", "'\"'\"'");
  }
}
