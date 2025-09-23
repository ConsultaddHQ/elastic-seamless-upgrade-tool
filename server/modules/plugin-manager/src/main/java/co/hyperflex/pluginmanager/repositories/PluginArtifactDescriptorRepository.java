package co.hyperflex.pluginmanager.repositories;

import co.hyperflex.core.repositories.AbstractMongoRepository;
import co.hyperflex.pluginmanager.entities.PluginArtifactDescriptor;
import java.util.Optional;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Repository;

@Repository
public class PluginArtifactDescriptorRepository extends AbstractMongoRepository<PluginArtifactDescriptor, String> {
  protected PluginArtifactDescriptorRepository(MongoTemplate mongoTemplate) {
    super(mongoTemplate, PluginArtifactDescriptor.class);
  }

  public Optional<PluginArtifactDescriptor> findByName(String pluginName) {
    Criteria criteria = Criteria.where(PluginArtifactDescriptor.PLUGIN_NAME).is(pluginName);
    Query query = new Query(criteria);
    return find(query).stream().findFirst();
  }
}
