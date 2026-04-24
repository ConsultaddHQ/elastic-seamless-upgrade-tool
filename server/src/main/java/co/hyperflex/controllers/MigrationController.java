package co.hyperflex.controllers;


import co.hyperflex.upgrade.services.dtos.MigrationInfoResponse;
import co.hyperflex.upgrade.services.migration.FeatureMigrationResponse;
import co.hyperflex.upgrade.services.migration.IndexMigrationResponse;
import co.hyperflex.upgrade.services.migration.IndexMigrationService;
import co.hyperflex.upgrade.services.migration.MigrationService;
import java.util.HashMap;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/clusters/{clusterId}/migrations")
public class MigrationController {

  private final MigrationService migrationService;
  private final IndexMigrationService indexMigrationService;

  public MigrationController(MigrationService migrationService, IndexMigrationService indexMigrationService) {
    this.migrationService = migrationService;
    this.indexMigrationService = indexMigrationService;
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

  @DeleteMapping(value = "/indices/{indexName}", produces = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<Map<String, String>> deleteIndex(@PathVariable String clusterId, @PathVariable String indexName) {

    boolean isDeleted = indexMigrationService.safeDeleteIndex(clusterId, indexName);
    Map<String, String> responseBody = new HashMap<>();

    if (isDeleted) {
      responseBody.put("status", "success");
      responseBody.put("message", "Index [" + indexName + "] was successfully deleted.");
      return ResponseEntity.ok(responseBody);
    } else {
      responseBody.put("status", "error");
      responseBody.put("message", "Failed to delete index [" + indexName + "]. Check server logs for details.");
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(responseBody);
    }
  }
}
