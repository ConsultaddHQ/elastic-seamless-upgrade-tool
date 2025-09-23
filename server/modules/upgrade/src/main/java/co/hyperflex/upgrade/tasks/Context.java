package co.hyperflex.upgrade.tasks;

import co.hyperflex.clients.elastic.ElasticClient;
import co.hyperflex.clients.kibana.KibanaClient;
import co.hyperflex.core.entites.clusters.nodes.ClusterNodeEntity;
import co.hyperflex.ssh.SshCommandExecutor;
import co.hyperflex.ssh.SudoBecome;
import org.slf4j.Logger;

public record Context(ClusterNodeEntity node, Configuration config, Logger logger,
                      ElasticClient elasticClient, KibanaClient kibanaClient) {

  public SshCommandExecutor getSshCommandExecutor() {
    return new SshCommandExecutor(
        node.getIp(),
        22,
        config.sshInfo().username(),
        config.sshInfo().keyPath(),
        new SudoBecome(config.sshInfo().becomeUser())
    );
  }
}
