package co.hyperflex.repositories;

import co.hyperflex.entities.upgrade.ClusterUpgradeJob;
import java.util.List;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Repository;

@Repository
public class ClusterUpgradeJobRepository extends AbstractMongoRepository<ClusterUpgradeJob, String> {

  protected ClusterUpgradeJobRepository(MongoTemplate mongoTemplate) {
    super(mongoTemplate, ClusterUpgradeJob.class);
  }

  public List<ClusterUpgradeJob> findByClusterId(String clusterId) {
    Query query = new Query();
    query.addCriteria(Criteria.where(ClusterUpgradeJob.CLUSTER_ID).is(clusterId));
    return mongoTemplate.find(query, ClusterUpgradeJob.class, collectionName);
  }
}
