package co.hyperflex.core.models.clusters;

import co.hyperflex.core.models.enums.ClusterType;
import com.fasterxml.jackson.annotation.JsonTypeName;

@JsonTypeName("SELF_MANAGED")
public class SelfManagedCluster extends Cluster {

  private SshInfo sshInfo;

  public SelfManagedCluster() {
    setType(ClusterType.SELF_MANAGED);
  }

  public SshInfo getSshInfo() {
    return sshInfo;
  }

  public void setSshInfo(SshInfo sshInfo) {
    this.sshInfo = sshInfo;
  }
}
