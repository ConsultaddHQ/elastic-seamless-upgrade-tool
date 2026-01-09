package co.hyperflex.precheck.concrete.index;

import co.hyperflex.precheck.contexts.IndexContext;
import co.hyperflex.precheck.core.BaseIndexPrecheck;
import co.hyperflex.precheck.services.IndexMetadataService;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class LuceneIndexCompatibilityPrecheck extends BaseIndexPrecheck {
  private final IndexMetadataService metadataService;

  public LuceneIndexCompatibilityPrecheck(IndexMetadataService metadataService) {
    this.metadataService = metadataService;
  }

  @Override
  public String getName() {
    return "Lucene index compatibility";
  }

  @Override
  public void run(IndexContext context) {
    var logger = context.getLogger();
    var indexName = context.getIndexName();

    boolean foundUnsupportedLucene = false;

    //Take minimum lucene version and validate for it only
    if (!metadataService.isLuceneCompatible(context.getCluster().getId(), indexName)) {
      logger.error("Index [{}] contains Lucene segments, too old for target. Please reindex before upgrade.", indexName);
      foundUnsupportedLucene = true;
    }

    if (foundUnsupportedLucene) {
      throw new RuntimeException();
    } else {
      logger.info("Index [{}] segments are compatible", indexName);
    }
  }

  @Override
  public boolean skippable() {
    return false;
  }
}
