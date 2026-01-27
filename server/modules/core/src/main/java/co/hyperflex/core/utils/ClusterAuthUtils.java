package co.hyperflex.core.utils;

import co.hyperflex.clients.client.ClientConnectionDetail;
import co.hyperflex.core.entites.clusters.ClusterEntity;
import co.hyperflex.core.services.secret.Secret;
import java.util.Base64;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ClusterAuthUtils {

  private static final Logger logger = LoggerFactory.getLogger(ClusterAuthUtils.class);

  private ClusterAuthUtils() {
  }

  public static Secret getAuthSecret(String username, String password, String apiKey) {
    if (!Optional.ofNullable(apiKey).orElse("").isEmpty()) {
      return new Secret("ApiKey " + apiKey);
    } else if (username != null && password != null) {
      String encodedCred = Base64.getEncoder()
          .encodeToString((username + ":" + password).getBytes());
      return new Secret("Basic " + encodedCred);
    } else {
      logger.error("Either apiKey or username/password must be provided.");
      throw new IllegalArgumentException("Either apiKey or username/password must be provided");
    }
  }


  public static ClientConnectionDetail getElasticConnectionDetail(ClusterEntity cluster) {
    return getElasticConnectionDetail(
        cluster,
        cluster.getId()
    );
  }

  public static ClientConnectionDetail getElasticConnectionDetail(ClusterEntity cluster, String secretKey) {
    return new ClientConnectionDetail(
        cluster.getElasticUrl(),
        secretKey
    );
  }

  public static ClientConnectionDetail getKibanaConnectionDetail(ClusterEntity cluster) {
    return getKibanaConnectionDetail(
        cluster,
        cluster.getId()
    );
  }

  public static ClientConnectionDetail getKibanaConnectionDetail(ClusterEntity cluster, String secretKey) {
    return new ClientConnectionDetail(
        cluster.getKibanaUrl(),
        secretKey
    );
  }
}
