package co.hyperflex.core.services.clusters.lock;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;
import org.springframework.stereotype.Component;

@Component
public class ReentrantClusterLockService implements ClusterLockService {
  private final Map<String, Lock> clusterLocks = new ConcurrentHashMap<>();

  private Lock getLock(String clusterId) {
    return clusterLocks.computeIfAbsent(clusterId, id -> new ReentrantLock());
  }

  @Override
  public void lock(String clusterId) {
    getLock(clusterId).lock();
  }

  @Override
  public void unlock(String clusterId) {
    getLock(clusterId).unlock();
  }
}

