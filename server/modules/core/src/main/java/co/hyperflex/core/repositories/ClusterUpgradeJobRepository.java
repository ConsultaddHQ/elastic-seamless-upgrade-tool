package co.hyperflex.core.repositories;

import co.hyperflex.core.upgrade.ClusterUpgradeJobEntity;
import java.util.List;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Repository;

@Repository
public class ClusterUpgradeJobRepository extends AbstractMongoRepository<ClusterUpgradeJobEntity, String> {

  protected ClusterUpgradeJobRepository(MongoTemplate mongoTemplate) {
    super(mongoTemplate, ClusterUpgradeJobEntity.class);
  }

  public List<ClusterUpgradeJobEntity> findByClusterId(String clusterId) {
    Query query = new Query();
    query.addCriteria(Criteria.where(ClusterUpgradeJobEntity.CLUSTER_ID).is(clusterId));
    return mongoTemplate.find(query, ClusterUpgradeJobEntity.class, collectionName);
  }
}
