package co.hyperflex.core.repositories;

import co.hyperflex.core.entites.settings.SettingEntity;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class SettingRepository extends AbstractMongoRepository<SettingEntity, String> {
  protected SettingRepository(MongoTemplate mongoTemplate) {
    super(mongoTemplate, SettingEntity.class);
  }
}
