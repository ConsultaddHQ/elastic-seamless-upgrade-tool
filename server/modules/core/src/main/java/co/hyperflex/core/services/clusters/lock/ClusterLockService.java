package co.hyperflex.core.services.clusters.lock;

public interface ClusterLockService {
  void lock(String clusterId);

  void unlock(String clusterId);
}
