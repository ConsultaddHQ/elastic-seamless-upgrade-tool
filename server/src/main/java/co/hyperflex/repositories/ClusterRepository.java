package co.hyperflex.repositories;

import co.hyperflex.common.exceptions.NotFoundException;
import co.hyperflex.core.entites.clusters.ClusterEntity;
import jakarta.validation.constraints.NotNull;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class ClusterRepository extends AbstractMongoRepository<ClusterEntity, String> {

  protected ClusterRepository(MongoTemplate mongoTemplate) {
    super(mongoTemplate, ClusterEntity.class);
  }

  @NotNull
  public ClusterEntity getCluster(String clusterId) {
    return findById(clusterId).orElseThrow(
        () -> new NotFoundException("Cluster not found with id: " + clusterId));
  }
}
