package co.hyperflex.repositories;

import co.hyperflex.entities.precheck.PrecheckGroup;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PrecheckGroupRepository extends MongoRepository<PrecheckGroup, String> {
  Optional<PrecheckGroup> findFirstByClusterIdOrderByCreatedAtDesc(String clusterId);
}
