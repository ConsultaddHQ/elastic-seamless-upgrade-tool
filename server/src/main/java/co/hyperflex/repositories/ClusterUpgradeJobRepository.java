package co.hyperflex.repositories;

import co.hyperflex.entities.upgrade.ClusterUpgradeJob;
import co.hyperflex.entities.upgrade.ClusterUpgradeStatus;
import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ClusterUpgradeJobRepository extends MongoRepository<ClusterUpgradeJob, String> {
  List<ClusterUpgradeJob> findByClusterIdAndStatusIsNot(
      String clusterId,
      ClusterUpgradeStatus status);
}
