package co.hyperflex.precheck.concrete.common;

import static org.mockito.Mockito.when;

import co.hyperflex.clients.elastic.ElasticClient;
import co.hyperflex.core.entites.clusters.nodes.ClusterNodeEntity;
import co.hyperflex.core.models.clusters.Distro;
import co.hyperflex.core.models.clusters.OperatingSystemInfo;
import co.hyperflex.core.models.enums.ClusterNodeType;
import co.hyperflex.core.upgrade.ClusterUpgradeJobEntity;
import co.hyperflex.precheck.concrete.node.common.SupportMatrixCheck;
import co.hyperflex.precheck.contexts.NodeContext;
import java.util.stream.Stream;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.slf4j.Logger;

@ExtendWith(MockitoExtension.class)
class SupportMatrixCheckTest {
  @Mock
  private NodeContext context;

  @Mock
  private ClusterUpgradeJobEntity upgradeJob;

  @Mock
  private OperatingSystemInfo operatingSystemInfo;

  @Mock
  private ClusterNodeEntity node;

  @Mock
  private ElasticClient elasticClient;

  @Mock
  private Logger logger;

  @InjectMocks
  private SupportMatrixCheck precheck;

  static Stream<Arguments> should_pass_check_data_pass() {
    return Stream.of(
        Arguments.of("8.18.7", "Ubuntu 24.04.2 LTS"),
        Arguments.of("7.17.5", "Amazon Linux 2023.8.20250818"),
        Arguments.of("7.17.26", "Debian GNU/Linux 12 (bookworm)"),
        Arguments.of("7.17.5", "Ubuntu 22.04.5 LTS")
    );
  }

  static Stream<Arguments> should_fail_check_data() {
    return Stream.of(
        Arguments.of("8.16.7", "Ubuntu 24.04.2 LTS"),
        Arguments.of("8.18.7", "Debian GNU/Linux 13 (trixie)"),
        Arguments.of("5.0.0", "Amazon Linux 2023.8.20250818"),
        Arguments.of("7.17.25", "Debian GNU/Linux 12 (bookworm)"),
        Arguments.of("7.17.4", "Ubuntu 22.04.5 LTS")
    );
  }

  static Stream<Arguments> should_pass_check_kibana_data() {
    return Stream.of(
        Arguments.of("8.18.7", "Ubuntu-24.04")
    );
  }

  static Stream<Arguments> should_fail_check_kibana_data() {
    return Stream.of(
        Arguments.of("8.14.7", "Ubuntu 24.04.2 LTS")
    );
  }

  @ParameterizedTest
  @MethodSource("should_pass_check_data_pass")
  void should_pass_check(String targetVersion, String prettyName) {
    var distro = new Distro(prettyName, prettyName);
    when(operatingSystemInfo.distro()).thenReturn(distro);
    when(context.getClusterUpgradeJob()).thenReturn(upgradeJob);
    when(context.getNode()).thenReturn(node);
    when(context.getLogger()).thenReturn(logger);
    when(upgradeJob.getTargetVersion()).thenReturn(targetVersion);
    when(node.getOs()).thenReturn(operatingSystemInfo);
    when(node.getType()).thenReturn(ClusterNodeType.ELASTIC);

    Assertions.assertDoesNotThrow(() -> precheck.run(context));
  }

  @ParameterizedTest
  @MethodSource("should_fail_check_data")
  void should_fail_check(String targetVersion, String prettyName) {
    var distro = new Distro(prettyName, prettyName);
    when(operatingSystemInfo.distro()).thenReturn(distro);
    when(context.getClusterUpgradeJob()).thenReturn(upgradeJob);
    when(context.getNode()).thenReturn(node);
    when(context.getLogger()).thenReturn(logger);
    when(upgradeJob.getTargetVersion()).thenReturn(targetVersion);
    when(node.getOs()).thenReturn(operatingSystemInfo);
    when(node.getType()).thenReturn(ClusterNodeType.ELASTIC);
    Assertions.assertThrows(Exception.class, () -> precheck.run(context));
  }

  @ParameterizedTest
  @MethodSource("should_pass_check_kibana_data")
  void should_pass_kibana_check(String targetVersion, String prettyName) {
    var distro = new Distro(prettyName, prettyName);
    when(operatingSystemInfo.distro()).thenReturn(distro);
    when(context.getClusterUpgradeJob()).thenReturn(upgradeJob);
    when(context.getNode()).thenReturn(node);
    when(context.getLogger()).thenReturn(logger);
    when(upgradeJob.getTargetVersion()).thenReturn(targetVersion);
    when(node.getOs()).thenReturn(operatingSystemInfo);
    when(node.getType()).thenReturn(ClusterNodeType.KIBANA);

    Assertions.assertDoesNotThrow(() -> precheck.run(context));
  }

  @ParameterizedTest
  @MethodSource("should_fail_check_kibana_data")
  void should_fail__kibana_check(String targetVersion, String prettyName) {
    var distro = new Distro(prettyName, prettyName);
    when(operatingSystemInfo.distro()).thenReturn(distro);
    when(context.getClusterUpgradeJob()).thenReturn(upgradeJob);
    when(context.getNode()).thenReturn(node);
    when(context.getLogger()).thenReturn(logger);
    when(upgradeJob.getTargetVersion()).thenReturn(targetVersion);
    when(node.getOs()).thenReturn(operatingSystemInfo);
    when(node.getType()).thenReturn(ClusterNodeType.KIBANA);
    Assertions.assertThrows(Exception.class, () -> precheck.run(context));
  }

}