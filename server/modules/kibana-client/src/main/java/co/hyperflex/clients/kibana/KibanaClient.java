package co.hyperflex.clients.kibana;

import co.hyperflex.clients.kibana.dto.GetKibanaDeprecationResponse;
import co.hyperflex.clients.kibana.dto.GetKibanaStatusResponse;
import co.hyperflex.common.client.ApiClient;

public interface KibanaClient extends ApiClient {
  boolean isKibanaReady(String host);

  String baseUrl(String host);

  String getKibanaVersion(String nodeIp);

  String getKibanaVersion();

  GetKibanaStatusResponse getKibanaNodeDetails(String nodeIp);

  GetKibanaDeprecationResponse getDeprecations();

  String getSnapshotCreationPageUrl();
}
