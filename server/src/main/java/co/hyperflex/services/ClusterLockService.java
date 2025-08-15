package co.hyperflex.services;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;
import org.springframework.stereotype.Component;

@Component
public class ClusterLockService {
  private final Map<String, Lock> clusterLocks = new ConcurrentHashMap<>();

  public Lock getLock(String clusterId) {
    return clusterLocks.computeIfAbsent(clusterId, id -> new ReentrantLock());
  }

  public void lock(String clusterId) {
    getLock(clusterId).lock();
  }

  public void unlock(String clusterId) {
    getLock(clusterId).unlock();
  }
}

