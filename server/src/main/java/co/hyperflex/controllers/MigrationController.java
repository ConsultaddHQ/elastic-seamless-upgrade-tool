package co.hyperflex.controllers;


import co.hyperflex.upgrade.services.dtos.MigrationInfoResponse;
import co.hyperflex.upgrade.services.migration.FeatureMigrationResponse;
import co.hyperflex.upgrade.services.migration.IndexMigrationResponse;
import co.hyperflex.upgrade.services.migration.MigrationService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/clusters/{clusterId}/migrations")
public class MigrationController {

  private final MigrationService migrationService;

  public MigrationController(MigrationService migrationService) {
    this.migrationService = migrationService;
  }

  @GetMapping("/info")
  public MigrationInfoResponse getMigrationInfo(@PathVariable String clusterId) {
    return migrationService.getMigrationInfo(clusterId);
  }

  @PostMapping("/migrate-system-features")
  public FeatureMigrationResponse migrateSystemFeatures(@PathVariable String clusterId) {
    return migrationService.migrate(clusterId);
  }

  @PostMapping("/reindex-indices")
  public IndexMigrationResponse reindexIndices(@PathVariable String clusterId) {
    return migrationService.reindexIndices(clusterId);
  }
}
