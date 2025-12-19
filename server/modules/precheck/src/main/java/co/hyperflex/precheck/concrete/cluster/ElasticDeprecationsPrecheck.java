package co.hyperflex.precheck.concrete.cluster;

import co.hyperflex.breakingchanges.services.deprecations.DeprecationService;
import co.hyperflex.precheck.contexts.ClusterContext;
import co.hyperflex.precheck.core.BaseClusterPrecheck;
import org.slf4j.Logger;
import org.springframework.stereotype.Component;

@Component
public class ElasticDeprecationsPrecheck extends BaseClusterPrecheck {
  private final DeprecationService deprecationService;

  public ElasticDeprecationsPrecheck(DeprecationService deprecationService) {
    this.deprecationService = deprecationService;
  }

  @Override
  public String getName() {
    return "Elastic Deprecations";
  }

  @Override
  public void run(ClusterContext context) {
    Logger logger = context.getLogger();
    var deprecations = deprecationService.getElasticDeprecations(context.getCluster().getId());

    if (deprecations.isEmpty()) {
      logger.warn("No elastic deprecations found");
    } else {
      for (var deprecation : deprecations) {
        logger.info("* {}", deprecation.issue());
        logger.info("\tLevel {}", deprecation.type());
        logger.info("\tDetail:  {}", deprecation.issueDetails());
        logger.info("\tResolutions");
        deprecation.resolutions().forEach(resolution -> logger.info("\t - {}", resolution));
        logger.info("");
      }
      throw new RuntimeException();
    }
  }
}
