package co.hyperflex.core.repositories;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

public abstract class AbstractMongoRepository<T, I> {

  protected static final String ID = "_id";
  protected final MongoTemplate mongoTemplate;
  protected final Class<T> entityClass;
  protected final String collectionName;

  protected AbstractMongoRepository(MongoTemplate mongoTemplate, Class<T> entityClass) {
    this.mongoTemplate = mongoTemplate;
    this.entityClass = entityClass;
    this.collectionName = resolveCollectionName(entityClass);
  }

  protected static <T> String resolveCollectionName(Class<T> entityClass) {
    Document doc = entityClass.getAnnotation(Document.class);
    if (doc != null && !doc.collection().isBlank()) {
      return doc.collection();
    }
    // default fallback: lowercase class name
    return entityClass.getSimpleName().toLowerCase();
  }

  public T save(T entity) {
    return mongoTemplate.save(entity, collectionName);
  }

  public List<? extends T> saveAll(List<? extends T> entities) {
    return entities.stream().parallel().map(this::save).toList();
  }

  public Optional<T> findById(I i) {
    return Optional.ofNullable(mongoTemplate.findById(i, entityClass, collectionName));
  }

  public List<T> findAll() {
    return mongoTemplate.findAll(entityClass, collectionName);
  }

  public void deleteById(I i) {
    Query query = new Query(Criteria.where(ID).is(i));
    mongoTemplate.remove(query, entityClass, collectionName);
  }

  public void delete(T entity) {
    mongoTemplate.remove(entity, collectionName);
  }

  public void updateFieldsById(I id, Map<String, Object> fieldsToUpdate) {
    if (fieldsToUpdate == null || fieldsToUpdate.isEmpty()) {
      return;
    }

    Query query = new Query(Criteria.where(ID).is(id));
    Update update = new Update();
    fieldsToUpdate.forEach(update::set);

    mongoTemplate.updateFirst(query, update, entityClass, collectionName);
  }

  public List<T> find(Query query) {
    return mongoTemplate.find(query, entityClass, collectionName);
  }

  public void updateById(I id, Update update) {
    Query query = new Query(Criteria.where(ID).is(id));
    mongoTemplate.updateFirst(query, update, entityClass, collectionName);
  }

  public void deleteAll() {
    Query query = new Query();
    mongoTemplate.remove(query, entityClass, collectionName);
  }
}
