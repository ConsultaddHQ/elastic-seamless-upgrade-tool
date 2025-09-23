package co.hyperflex.ansible;

public class ExecutionContext {
  private final String hostIp;
  private final String sshUser;
  private final String sshKeyPath;
  private final boolean useBecome;
  private final String becomeUser;

  public ExecutionContext(String hostIp, String sshUser, String sshKeyPath, boolean useBecome, String becomeUser) {
    this.hostIp = hostIp;
    this.sshUser = sshUser;
    this.sshKeyPath = sshKeyPath;
    this.useBecome = useBecome;
    this.becomeUser = becomeUser;
  }

  public String getHostIp() {
    return hostIp;
  }

  public String getSshUser() {
    return sshUser;
  }

  public String getSshKeyPath() {
    return sshKeyPath;
  }

  public boolean isUseBecome() {
    return useBecome;
  }

  public String getBecomeUser() {
    return becomeUser;
  }
}
