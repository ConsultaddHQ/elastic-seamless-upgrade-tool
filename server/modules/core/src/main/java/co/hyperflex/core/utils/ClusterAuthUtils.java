package co.hyperflex.core.utils;

import co.hyperflex.common.client.ClientAuthHeader;
import co.hyperflex.common.client.ClientConnectionDetail;
import co.hyperflex.core.entites.clusters.ClusterEntity;
import java.util.Base64;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ClusterAuthUtils {

  private static final Logger logger = LoggerFactory.getLogger(ClusterAuthUtils.class);

  private static ClientAuthHeader getAuthHeader(ClusterEntity cluster) {
    if (!Optional.ofNullable(cluster.getApiKey()).orElse("").isEmpty()) {
      return new ClientAuthHeader("Authorization", "ApiKey " + cluster.getApiKey());
    } else if (cluster.getUsername() != null && cluster.getPassword() != null) {
      String encodedCred = Base64.getEncoder()
          .encodeToString((cluster.getUsername() + ":" + cluster.getPassword()).getBytes());
      return new ClientAuthHeader("Authorization", "Basic " + encodedCred);
    } else {
      logger.error("Either apiKey or username/password must be provided for cluster {}",
          cluster.getId());
      throw new IllegalArgumentException("Either apiKey or username/password must be provided");
    }
  }

  public static ClientConnectionDetail getKibanaConnectionDetail(ClusterEntity cluster) {
    return new ClientConnectionDetail(
        cluster.getKibanaUrl(),
        getAuthHeader(cluster)
    );
  }

  public static ClientConnectionDetail getElasticConnectionDetail(ClusterEntity cluster) {
    return new ClientConnectionDetail(
        cluster.getElasticUrl(),
        getAuthHeader(cluster)
    );
  }
}
