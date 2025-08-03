package co.hyperflex.entities.cluster;

public enum PackageManager {
  APT,     // Debian/Ubuntu
  DNF,     // RHEL/Rocky/Alma
  YUM,     // CentOS, Amazon Linux 2
  ZYPPER  // openSUSE/SLES
}

