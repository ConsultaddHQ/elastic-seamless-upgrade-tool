package co.hyperflex.repositories;

import co.hyperflex.entities.BreakingChangeEntity;
import co.hyperflex.utils.VersionUtils;
import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BreakingChangeRepository extends MongoRepository<BreakingChangeEntity, String> {

  default List<BreakingChangeEntity> getBreakingChanges(String currentVersion, String targetVersion) {
    return findAll()
        .stream()
        .filter(breakingChange -> VersionUtils.isVersionGt(breakingChange.getVersion(), currentVersion)
            && VersionUtils.isVersionGte(targetVersion, breakingChange.getVersion()))
        .toList();
  }
}
