package co.hyperflex.precheck.services;


import co.hyperflex.breakingchanges.BreakingChangeRepository;
import co.hyperflex.breakingchanges.entities.BreakingChangeEntity;
import co.hyperflex.clients.elastic.ElasticClient;
import co.hyperflex.clients.elastic.ElasticsearchClientProvider;
import co.hyperflex.clients.elastic.dto.ElasticDeprecation;
import co.hyperflex.clients.elastic.dto.GetElasticDeprecationResponse;
import co.hyperflex.clients.kibana.KibanaClient;
import co.hyperflex.clients.kibana.KibanaClientProvider;
import co.hyperflex.clients.kibana.dto.GetKibanaDeprecationResponse;
import co.hyperflex.core.services.upgrade.ClusterUpgradeJobService;
import co.hyperflex.core.upgrade.ClusterUpgradeJobEntity;
import co.hyperflex.precheck.services.dtos.GetGroupedPrecheckResponse;
import co.hyperflex.precheck.services.dtos.GetPrecheckEntry;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.TreeMap;
import java.util.function.Consumer;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class PrecheckReportService {

  private static final Logger log = LoggerFactory.getLogger(PrecheckReportService.class);
  private final ClusterUpgradeJobService clusterUpgradeJobService;
  private final PrecheckRunService precheckRunService;
  private final KibanaClientProvider kibanaClientProvider;
  private final ElasticsearchClientProvider elasticsearchClientProvider;
  private final BreakingChangeRepository breakingChangeRepository;

  public PrecheckReportService(ClusterUpgradeJobService clusterUpgradeJobService, PrecheckRunService precheckRunService,
                               KibanaClientProvider kibanaClientProvider, ElasticsearchClientProvider elasticsearchClientProvider,
                               BreakingChangeRepository breakingChangeRepository) {
    this.clusterUpgradeJobService = clusterUpgradeJobService;
    this.precheckRunService = precheckRunService;
    this.kibanaClientProvider = kibanaClientProvider;
    this.elasticsearchClientProvider = elasticsearchClientProvider;
    this.breakingChangeRepository = breakingChangeRepository;
  }

  private static Consumer<ElasticDeprecation> getDeprecationConsumer(StringBuilder md) {
    return issue -> {
      md.append("- **").append(issue.message()).append("**\n");
      if (issue.details() != null) {
        md.append("  - Details: ").append(issue.details()).append("\n");
      }
      if (issue.level() != null) {
        md.append("  - Level: `").append(issue.level()).append("`\n");
      }
    };
  }

  public String generatePrecheckReportMdContent(String clusterId) {
    ClusterUpgradeJobEntity job = clusterUpgradeJobService.getActiveJobByClusterId(clusterId);
    final String currentVersion = job.getCurrentVersion();
    final String targetVersion = job.getTargetVersion();

    final GetGroupedPrecheckResponse groupedPrechecks = precheckRunService.getGroupedPrecheckByClusterId(clusterId);

    StringBuilder md = new StringBuilder();
    md.append("# Elasticsearch Pre-check Report\n\n");
    md.append("Generated on: ").append(Instant.now()).append("\n\n");

    // Node summary
    md.append("## Node Summary\n");
    md.append("| Node Name | IP | Status |\n");
    md.append("|-----------|----|--------|\n");
    groupedPrechecks.node().forEach(node -> {
      md.append(String.format("| %s | %s | %s |\n", node.name(), node.ip(), node.status()));
    });

    md.append("\n## Detailed Pre-checks\n");
    groupedPrechecks.node().forEach(node -> {
      md.append(String.format("\n### 🖥️ %s (%s)\n", node.name(), node.ip()));
      md.append("| Check | Status | Duration (s) |\n");
      md.append("|-------|--------|---------------|\n");
      for (GetPrecheckEntry check : node.prechecks()) {
        md.append(String.format("| %s | %s | %s |\n", check.name(), check.status(), check.duration()));
      }

      md.append("\n<details><summary>Show Logs</summary>\n\n");
      for (GetPrecheckEntry check : node.prechecks()) {
        md.append("#### ").append(check.name()).append("\n");
        List<String> logs = check.logs() != null && !check.logs().isEmpty() ? check.logs() : List.of("N/A");
        md.append("```\n").append(String.join("\n", logs)).append("\n```\n");
      }
      md.append("</details>\n");
    });

    // Index summary
    md.append("\n\n## Index Summary\n");
    md.append("| Index Name | Status |\n");
    md.append("|-----------|--------|\n");
    for (var index : groupedPrechecks.index()) {
      md.append(String.format("| %s | %s |\n", index.name(), index.status()));
    }

    md.append("\n## Detailed Pre-checks\n");
    for (var index : groupedPrechecks.index()) {
      md.append(String.format("\n### 🖥️ %s\n", index.name()));
      md.append("| Check | Status | Duration (s) |\n");
      md.append("|-------|--------|---------------|\n");
      for (var check : index.prechecks()) {
        md.append(String.format("| %s | %s | %s |\n", check.name(), check.status(), check.duration()));
      }

      md.append("\n<details><summary>Show Logs</summary>\n\n");
      for (var check : index.prechecks()) {
        md.append("#### ").append(check.name()).append("\n");
        List<String> logs = check.logs() != null && !check.logs().isEmpty() ? check.logs() : List.of("N/A");
        md.append("```\n").append(String.join("\n", logs)).append("\n```\n");
      }
      md.append("</details>\n");
    }

    md.append("\n\n").append(getESDeprecationsMdReport(clusterId));
    md.append("\n\n").append(getKibanaDeprecationsMdReport(clusterId));
    md.append("\n\n").append(getBreakingChangesMdReport(currentVersion, targetVersion));


    return md.toString();
  }

  private StringBuilder getBreakingChangesMdReport(String currentVersion, String targetVersion) {
    StringBuilder md = new StringBuilder();
    List<BreakingChangeEntity> breakingChanges = breakingChangeRepository.getBreakingChanges(currentVersion, targetVersion);

    md.append("# Breaking Changes Report\n\n").append("From version: **").append(currentVersion).append("** to **").append(targetVersion)
        .append("**\n\n");

    if (breakingChanges.isEmpty()) {
      md.append("No breaking changes found");
      return md;
    }

    // Group by version first
    Map<String, List<BreakingChangeEntity>> groupedByVersion =
        breakingChanges.stream().collect(Collectors.groupingBy(BreakingChangeEntity::getVersion, TreeMap::new, Collectors.toList()));


    groupedByVersion.forEach((version, changes) -> {
      md.append("## Version ").append(version).append("\n\n");

      // Group within version by category
      Map<String, List<BreakingChangeEntity>> groupedByCategory =
          changes.stream().collect(Collectors.groupingBy(BreakingChangeEntity::getCategory, TreeMap::new, Collectors.toList()));

      groupedByCategory.forEach((category, categoryChanges) -> {
        md.append("### ").append(category).append("\n\n");

        for (BreakingChangeEntity change : categoryChanges) {
          md.append("- **").append(change.getTitle()).append("**: ").append(change.getDescription()).append("\n");
        }

        md.append("\n");
      });
    });

    return md;
  }


  private String getESDeprecationsMdReport(String clusterId) {
    ElasticClient client = elasticsearchClientProvider.getClient(clusterId);
    GetElasticDeprecationResponse deprecationResponse = client.getDeprecation();

    StringBuilder md = new StringBuilder("## Elasticsearch Deprecations\n\n");

    final boolean[] found = {false};

    Optional.ofNullable(deprecationResponse.clusterSettings()).ifPresent(clusterSettings -> {
      if (!clusterSettings.isEmpty()) {
        md.append("### Cluster Settings\n");
        clusterSettings.forEach(getDeprecationConsumer(md));
        md.append("\n");
        found[0] = true;
      }
    });

    Optional.ofNullable(deprecationResponse.nodeSettings()).ifPresent(nodeSettings -> {
      if (!nodeSettings.isEmpty()) {
        md.append("### Nodes Settings\n");
        nodeSettings.forEach(getDeprecationConsumer(md));
        md.append("\n");
        found[0] = true;
      }
    });

    Optional.ofNullable(deprecationResponse.indexSettings()).ifPresent(indexSettings -> {
      if (!indexSettings.isEmpty()) {
        md.append("### Index Settings\n");
        indexSettings.forEach((s, deprecations) -> {
          md.append("#### ").append(s).append("\n");
          deprecations.forEach(getDeprecationConsumer(md));
        });
        md.append("\n");
        found[0] = true;
      }
    });

    Optional.ofNullable(deprecationResponse.dataStreams()).ifPresent(dataStreams -> {
      if (!dataStreams.isEmpty()) {
        md.append("### Data Stream\n");
        dataStreams.forEach((s, deprecations) -> {
          md.append("#### ").append(s).append("\n");
          deprecations.forEach(getDeprecationConsumer(md));
        });
        md.append("\n");
        found[0] = true;
      }
    });

    Optional.ofNullable(deprecationResponse.templates()).ifPresent(templates -> {
      if (!templates.isEmpty()) {
        md.append("### Templates\n");
        templates.forEach((s, deprecations) -> {
          md.append("#### ").append(s).append("\n");
          deprecations.forEach(getDeprecationConsumer(md));
        });
        md.append("\n");
        found[0] = true;
      }
    });

    Optional.ofNullable(deprecationResponse.ilmPolicies()).ifPresent(ilmPolicies -> {
      if (!ilmPolicies.isEmpty()) {
        md.append("### ILM Policies\n");
        ilmPolicies.forEach((s, deprecations) -> {
          md.append("#### ").append(s).append("\n");
          deprecations.forEach(getDeprecationConsumer(md));
        });
        md.append("\n");
        found[0] = true;
      }
    });

    Optional.ofNullable(deprecationResponse.mlSettings()).ifPresent(mlSettings -> {
      if (!mlSettings.isEmpty()) {
        md.append("### ML Settings\n");
        mlSettings.forEach(getDeprecationConsumer(md));
        md.append("\n");
        found[0] = true;
      }
    });

    if (!found[0]) {
      md.append("### No deprecations found\n");
    }
    return md.toString();
  }

  private String getKibanaDeprecationsMdReport(String clusterId) {
    KibanaClient client = kibanaClientProvider.getClient(clusterId);
    List<GetKibanaDeprecationResponse.Deprecation> deprecations = client.getDeprecations().deprecations();

    StringBuilder md = new StringBuilder("## ⚠️ Kibana Deprecations\n\n");

    if (deprecations.isEmpty()) {
      md.append("N/A");
    } else {
      for (var item : deprecations) {
        md.append("- **").append(item.title()).append("**\n");
        if (item.message() != null) {
          md.append("  - ").append(item.message()).append("\n");
        }
        if (item.level() != null) {
          md.append("  - Level: `").append(item.level()).append("`\n");
        }

        GetKibanaDeprecationResponse.CorrectiveActions correctiveActions = item.correctiveActions();
        if (correctiveActions != null && correctiveActions.manualSteps() != null) {
          List<String> steps = correctiveActions.manualSteps();
          if (!steps.isEmpty()) {
            md.append("  - Manual Steps:\n");
            for (String step : steps) {
              md.append("    - ").append(step).append("\n");
            }
          }
        }
        md.append("\n");
      }
    }

    return md.toString();
  }
}

