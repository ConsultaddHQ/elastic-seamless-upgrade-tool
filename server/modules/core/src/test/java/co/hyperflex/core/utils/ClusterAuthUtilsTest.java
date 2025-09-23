package co.hyperflex.core.utils;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import co.hyperflex.common.client.ClientAuthHeader;
import co.hyperflex.core.entites.clusters.ClusterEntity;
import co.hyperflex.core.entites.clusters.SelfManagedClusterEntity;
import org.junit.jupiter.api.Test;

class ClusterAuthUtilsTest {

  @Test
  void getAuthHeader_withApiKey() {
    // Arrange
    ClusterEntity cluster = new SelfManagedClusterEntity();
    cluster.setApiKey("my-api-key");

    // Act
    ClientAuthHeader authHeader = ClusterAuthUtils.getElasticConnectionDetail(cluster).authHeader();

    // Assert
    assertEquals("Authorization", authHeader.key());
    assertEquals("ApiKey my-api-key", authHeader.value());
  }

  @Test
  void getAuthHeader_withUsernamePassword() {
    // Arrange
    ClusterEntity cluster = new SelfManagedClusterEntity();
    cluster.setUsername("user");
    cluster.setPassword("pass");

    // Act
    ClientAuthHeader authHeader = ClusterAuthUtils.getElasticConnectionDetail(cluster).authHeader();

    // Assert
    assertEquals("Authorization", authHeader.key());
    assertEquals("Basic dXNlcjpwYXNz", authHeader.value()); // user:pass in base64
  }

  @Test
  void getAuthHeader_noCredentials_throwsException() {
    // Arrange
    ClusterEntity cluster = new SelfManagedClusterEntity();

    // Act & Assert
    assertThrows(IllegalArgumentException.class, () -> {
      ClusterAuthUtils.getElasticConnectionDetail(cluster).authHeader();
    });
  }
}
