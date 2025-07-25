package co.hyperflex.repositories;

import co.hyperflex.entities.precheck.PrecheckRun;
import co.hyperflex.entities.precheck.PrecheckStatus;
import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PrecheckRunRepository extends MongoRepository<PrecheckRun, String> {
  List<PrecheckRun> findTop40ByStatus(PrecheckStatus status);

  List<PrecheckRun> findByPrecheckGroupId(String precheckGroupId);

}
