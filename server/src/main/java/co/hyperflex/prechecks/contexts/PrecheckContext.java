package co.hyperflex.prechecks.contexts;

import co.hyperflex.clients.ElasticClient;
import co.hyperflex.clients.KibanaClient;
import co.hyperflex.entities.cluster.Cluster;
import co.hyperflex.prechecks.core.PrecheckLogger;

public abstract class PrecheckContext {
  private final Cluster cluster;
  private final ElasticClient elasticClient;
  private final KibanaClient kibanaClient;
  private final PrecheckLogger logger;

  protected PrecheckContext(Cluster cluster, ElasticClient elasticClient, KibanaClient kibanaClient,
                            PrecheckLogger logger) {
    this.cluster = cluster;
    this.elasticClient = elasticClient;
    this.kibanaClient = kibanaClient;
    this.logger = logger;
  }

  public Cluster getCluster() {
    return cluster;
  }

  public ElasticClient getElasticClient() {
    return elasticClient;
  }

  public KibanaClient getKibanaClient() {
    return kibanaClient;
  }

  public PrecheckLogger getLogger() {
    return logger;
  }
}
