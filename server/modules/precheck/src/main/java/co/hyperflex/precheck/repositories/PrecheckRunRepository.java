package co.hyperflex.precheck.repositories;

import static co.hyperflex.precheck.entities.PrecheckRunEntity.CLUSTER_UPGRADE_JOB_ID;
import static co.hyperflex.precheck.entities.PrecheckRunEntity.LOGS;
import static co.hyperflex.precheck.entities.PrecheckRunEntity.SEVERITY;
import static co.hyperflex.precheck.entities.PrecheckRunEntity.STATUS;

import co.hyperflex.core.repositories.AbstractMongoRepository;
import co.hyperflex.precheck.core.enums.PrecheckStatus;
import co.hyperflex.precheck.core.enums.PrecheckType;
import co.hyperflex.precheck.entities.PrecheckRunEntity;
import co.hyperflex.precheck.repositories.projection.PrecheckStatusAndSeverityView;
import java.util.List;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Repository;

@Repository
public class PrecheckRunRepository extends AbstractMongoRepository<PrecheckRunEntity, String> {

  public PrecheckRunRepository(MongoTemplate mongoTemplate) {
    super(mongoTemplate, PrecheckRunEntity.class);
  }

  public List<PrecheckRunEntity> getPendingPrechecks(int batchSize) {
    Query query = new Query();
    query.addCriteria(Criteria.where(STATUS).is(PrecheckStatus.PENDING));
    query.limit(batchSize);
    return mongoTemplate.find(query, PrecheckRunEntity.class, collectionName);
  }

  public List<PrecheckRunEntity> getAllByJobId(String upgradeJobId) {
    return getAllByJobId(upgradeJobId, null);
  }

  public List<PrecheckRunEntity> getAllByJobId(String upgradeJobId, PrecheckType type) {
    Criteria criteria = Criteria.where(CLUSTER_UPGRADE_JOB_ID).is(upgradeJobId);
    if (type != null) {
      criteria = criteria.andOperator(Criteria.where(PrecheckRunEntity.TYPE).is(type));
    }
    Query query = new Query(criteria);
    return find(query);
  }

  public List<PrecheckStatusAndSeverityView> findStatusAndSeverityByUpgradeJobId(String upgradeJobId) {
    Query query = new Query();
    query.addCriteria(Criteria.where(CLUSTER_UPGRADE_JOB_ID).is(upgradeJobId));
    query.fields().include(STATUS).include(SEVERITY);
    return mongoTemplate.find(query, PrecheckStatusAndSeverityView.class, collectionName);
  }

  public void addLog(String precheckRunId, String message) {
    Update update = new Update().push(LOGS, message);
    updateById(precheckRunId, update);
  }

  public int getCountByJobId(String upgradeJobId) {
    Query query = new Query();
    query.addCriteria(Criteria.where(CLUSTER_UPGRADE_JOB_ID).is(upgradeJobId));
    return find(query).size();
  }
}