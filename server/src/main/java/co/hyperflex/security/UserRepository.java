package co.hyperflex.security;

import co.hyperflex.core.repositories.AbstractMongoRepository;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Repository;

@Repository
public class UserRepository extends AbstractMongoRepository<UserEntity, String> {
  public UserRepository(MongoTemplate mongoTemplate) {
    super(mongoTemplate, UserEntity.class);
  }

  public UserEntity findByUsername(String username) {
    Query query = Query.query(Criteria.where(UserEntity.USERNAME).is(username));
    return mongoTemplate.findOne(query, UserEntity.class);
  }
}
