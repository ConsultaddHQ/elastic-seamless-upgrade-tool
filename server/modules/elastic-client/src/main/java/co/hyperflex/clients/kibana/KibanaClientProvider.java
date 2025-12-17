package co.hyperflex.clients.kibana;

import co.hyperflex.clients.client.ClientConnectionDetail;

public interface KibanaClientProvider {
  KibanaClient getClient(String clusterId);

  KibanaClient getClient(ClientConnectionDetail detail);
}
