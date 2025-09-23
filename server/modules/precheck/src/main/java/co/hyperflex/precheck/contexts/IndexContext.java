package co.hyperflex.precheck.contexts;

import co.hyperflex.clients.elastic.ElasticClient;
import co.hyperflex.clients.kibana.KibanaClient;
import co.hyperflex.core.entites.clusters.ClusterEntity;
import co.hyperflex.core.upgrade.ClusterUpgradeJobEntity;
import org.slf4j.Logger;

public class IndexContext extends PrecheckContext {
  private final String indexName;

  public IndexContext(ClusterEntity cluster, ElasticClient elasticClient, KibanaClient kibanaClient,
                      String indexName, ClusterUpgradeJobEntity clusterUpgradeJob,
                      Logger logger) {
    super(cluster, elasticClient, kibanaClient, logger, clusterUpgradeJob);
    this.indexName = indexName;
  }

  public String getIndexName() {
    return indexName;
  }
}
