package co.hyperflex.precheck.contexts;

import co.hyperflex.clients.elastic.ElasticClient;
import co.hyperflex.clients.kibana.KibanaClient;
import co.hyperflex.core.entites.clusters.ClusterEntity;
import co.hyperflex.core.upgrade.ClusterUpgradeJobEntity;
import org.slf4j.Logger;

public class ClusterContext extends PrecheckContext {
  public ClusterContext(ClusterEntity cluster, ElasticClient elasticClient, KibanaClient kibanaClient,
                        ClusterUpgradeJobEntity clusterUpgradeJob, Logger logger) {
    super(cluster, elasticClient, kibanaClient, logger, clusterUpgradeJob);
  }
}
