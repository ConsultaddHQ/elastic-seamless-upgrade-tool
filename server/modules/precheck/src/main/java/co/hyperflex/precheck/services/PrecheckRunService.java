package co.hyperflex.precheck.services;

import co.hyperflex.breakingchanges.BreakingChangeRepository;
import co.hyperflex.core.exceptions.AppException;
import co.hyperflex.core.exceptions.HttpStatus;
import co.hyperflex.core.services.notifications.NotificationService;
import co.hyperflex.core.services.notifications.PrecheckProgressChangeEvent;
import co.hyperflex.core.services.upgrade.ClusterUpgradeJobService;
import co.hyperflex.precheck.core.Precheck;
import co.hyperflex.precheck.core.enums.PrecheckSeverity;
import co.hyperflex.precheck.core.enums.PrecheckStatus;
import co.hyperflex.precheck.core.enums.PrecheckType;
import co.hyperflex.precheck.entities.IndexPrecheckRunEntity;
import co.hyperflex.precheck.entities.NodePrecheckRunEntity;
import co.hyperflex.precheck.entities.PrecheckRunEntity;
import co.hyperflex.precheck.mappers.PrecheckMapper;
import co.hyperflex.precheck.registry.PrecheckRegistry;
import co.hyperflex.precheck.repositories.PrecheckRunRepository;
import co.hyperflex.precheck.repositories.projection.PrecheckStatusAndSeverityView;
import co.hyperflex.precheck.services.dtos.GetBreakingChangeEntry;
import co.hyperflex.precheck.services.dtos.GetGroupedPrecheckResponse;
import co.hyperflex.precheck.services.dtos.GetIndexPrecheckGroup;
import co.hyperflex.precheck.services.dtos.GetNodePrecheckGroup;
import co.hyperflex.precheck.services.dtos.GetPrecheckEntry;
import co.hyperflex.precheck.services.dtos.GetPrecheckSummaryResponse;
import co.hyperflex.precheck.services.dtos.PrecheckRerunRequest;
import co.hyperflex.precheck.services.dtos.SkipPrecheckResponse;
import jakarta.validation.constraints.NotNull;
import java.util.Comparator;
import java.util.Date;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

@Service
public class PrecheckRunService {

  private final PrecheckRunRepository precheckRunRepository;
  private final BreakingChangeRepository breakingChangeRepository;
  private final ClusterUpgradeJobService clusterUpgradeJobService;
  private final MongoTemplate mongoTemplate;
  private final PrecheckRegistry precheckRegistry;
  private final PrecheckMapper precheckMapper;
  private final NotificationService notificationService;

  public PrecheckRunService(
      PrecheckRunRepository precheckRunRepository,
      BreakingChangeRepository breakingChangeRepository,
      ClusterUpgradeJobService clusterUpgradeJobService,
      MongoTemplate mongoTemplate,
      PrecheckRegistry precheckRegistry,
      PrecheckMapper precheckMapper,
      NotificationService notificationService) {
    this.precheckRunRepository = precheckRunRepository;
    this.breakingChangeRepository = breakingChangeRepository;
    this.clusterUpgradeJobService = clusterUpgradeJobService;
    this.mongoTemplate = mongoTemplate;
    this.precheckRegistry = precheckRegistry;
    this.precheckMapper = precheckMapper;
    this.notificationService = notificationService;
  }

  public GetGroupedPrecheckResponse getGroupedPrecheckByClusterId(String clusterId) {
    List<GetPrecheckEntry> clusterPrechecks = getClusterPrechecks(clusterId);
    List<GetNodePrecheckGroup> nodeGroups = getNodePrecheckGroups(clusterId);
    List<GetIndexPrecheckGroup> indexGroups = getIndexPrecheckGroups(clusterId);
    return new GetGroupedPrecheckResponse(nodeGroups, clusterPrechecks, indexGroups);
  }

  public List<GetBreakingChangeEntry> getBreakingChanges(final String clusterId) {
    var clusterUpgradeJob = clusterUpgradeJobService.getLatestJobByClusterId(clusterId);
    return breakingChangeRepository.getBreakingChanges(clusterUpgradeJob.getCurrentVersion(), clusterUpgradeJob.getTargetVersion())
        .stream()
        .map(breakingChange -> {
          List<String> logs = List.of(
              "Category: " + breakingChange.getCategory(),
              "Description:",
              breakingChange.getDetail(),
              "",
              "Impact:",
              breakingChange.getImpact(),
              "Source:",
              breakingChange.getUrl()
          );
          return new GetBreakingChangeEntry(
              breakingChange.getId(),
              breakingChange.getTitle() + "(" + breakingChange.getVersion() + ")",
              logs,
              PrecheckSeverity.WARNING,
              PrecheckStatus.FAILED
          );
        })
        .toList();
  }

  public List<GetPrecheckEntry> getClusterPrechecks(String clusterId) {
    var clusterUpgradeJob = clusterUpgradeJobService.getLatestJobByClusterId(clusterId);
    return precheckRunRepository.getAllByJobId(clusterUpgradeJob.getId(), PrecheckType.CLUSTER)
        .stream()
        .map(precheckMapper::toPrecheckEntry)
        .sorted(Comparator.comparing(GetPrecheckEntry::name))
        .toList();
  }


  public List<GetIndexPrecheckGroup> getIndexPrecheckGroups(String clusterId) {
    var clusterUpgradeJob = clusterUpgradeJobService.getLatestJobByClusterId(clusterId);

    return precheckRunRepository.getAllByJobId(clusterUpgradeJob.getId(), PrecheckType.INDEX)
        .stream()
        .map(IndexPrecheckRunEntity.class::cast)
        .sorted(Comparator.comparing(IndexPrecheckRunEntity::getName))
        .collect(Collectors.groupingBy(
            pr -> pr.getIndex().getName(),
            Collectors.mapping(precheckMapper::toPrecheckEntry, Collectors.toList())
        ))
        .entrySet()
        .stream()
        .map(entry -> {
          var entries = entry.getValue();
          return new GetIndexPrecheckGroup(
              entry.getKey(),
              entry.getKey(),
              getMergedPrecheckStatusFromEntries(entries),
              getMergedPrecheckSeverity(entries),
              entries
          );
        })
        .sorted(Comparator.comparing(GetIndexPrecheckGroup::name))
        .toList();
  }


  public List<GetNodePrecheckGroup> getNodePrecheckGroups(String clusterId) {
    var clusterUpgradeJob = clusterUpgradeJobService.getLatestJobByClusterId(clusterId);

    // Map nodeId -> NodeInfo (first occurrence wins)
    var nodeInfoMap = new HashMap<String, NodePrecheckRunEntity.NodeInfo>();

    // Group prechecks by nodeId
    var nodePrechecks =
        precheckRunRepository.getAllByJobId(clusterUpgradeJob.getId(), PrecheckType.NODE)
            .stream()
            .map(NodePrecheckRunEntity.class::cast)
            .sorted(Comparator.comparing(NodePrecheckRunEntity::getName))
            .peek(pr -> nodeInfoMap.putIfAbsent(pr.getNode().id(), pr.getNode()))
            .collect(Collectors.groupingBy(
                pr -> pr.getNode().id(),
                Collectors.mapping(precheckMapper::toPrecheckEntry, Collectors.toList())
            ));

    return nodePrechecks.entrySet().stream()
        .sorted(Comparator.comparingInt(entry -> nodeInfoMap.get(entry.getKey()).rank()))
        .map(entry -> {
          var nodeInfo = nodeInfoMap.get(entry.getKey());
          var entries = entry.getValue();
          return new GetNodePrecheckGroup(
              nodeInfo.id(),
              nodeInfo.ip(),
              nodeInfo.name(),
              getMergedPrecheckStatusFromEntries(entries),
              getMergedPrecheckSeverity(entries),
              entries
          );
        })
        .toList();
  }


  public PrecheckStatus getStatusByUpgradeJobId(@NotNull String upgradeJobId) {
    var statuses = precheckRunRepository.findStatusAndSeverityByUpgradeJobId(upgradeJobId)
        .stream()
        .filter(status -> status.severity() == PrecheckSeverity.ERROR)
        .map(PrecheckStatusAndSeverityView::status)
        .toList();
    return getMergedPrecheckStatus(statuses);
  }

  public void rerunPrechecks(String clusterUpgradeJobId, PrecheckRerunRequest request) {
    List<Criteria> criteriaList = new LinkedList<>();

    if (request.precheckIds() != null && !request.precheckIds().isEmpty()) {
      criteriaList.add(Criteria.where("_id").in(request.precheckIds()));
    }

    if (request.nodeIds() != null && !request.nodeIds().isEmpty()) {
      criteriaList.add(Criteria.where("node._id").in(request.nodeIds()));
    }

    if (request.indexNames() != null && !request.indexNames().isEmpty()) {
      criteriaList.add(Criteria.where("index.name").in(request.indexNames()));
    }

    if (Boolean.TRUE.equals(request.cluster())) {
      criteriaList.add(Criteria.where("type").is(PrecheckType.CLUSTER));
    }

    Query query;
    if (criteriaList.isEmpty()) {
      query = new Query(Criteria.where(PrecheckRunEntity.CLUSTER_UPGRADE_JOB_ID).is(clusterUpgradeJobId));
    } else {
      query = new Query(new Criteria().orOperator(criteriaList)
          .andOperator(Criteria.where(PrecheckRunEntity.CLUSTER_UPGRADE_JOB_ID).is(clusterUpgradeJobId)));
    }
    Update update = new Update().set(PrecheckRunEntity.STATUS, PrecheckStatus.PENDING).set(PrecheckRunEntity.START_TIME, null)
        .set(PrecheckRunEntity.END_TIME, null);
    notificationService.sendNotification(new PrecheckProgressChangeEvent());
    mongoTemplate.updateMulti(query, update, PrecheckRunEntity.class);
  }

  private PrecheckStatus getMergedPrecheckStatus(List<PrecheckStatus> statuses) {
    boolean hasCompleted = false;
    boolean hasPending = false;
    boolean hasRunning = false;

    for (var status : statuses) {
      if (status == PrecheckStatus.FAILED) {
        return PrecheckStatus.FAILED;
      }
      if (status == PrecheckStatus.RUNNING) {
        hasRunning = true;
      }
      if (status == PrecheckStatus.PENDING) {
        hasPending = true;
      }
      if (status == PrecheckStatus.COMPLETED) {
        hasCompleted = true;
      }
    }

    if ((hasPending && hasCompleted) || hasRunning) {
      return PrecheckStatus.RUNNING;
    }
    if (hasPending) {
      return PrecheckStatus.PENDING;
    }
    return PrecheckStatus.COMPLETED;
  }

  private PrecheckStatus getMergedPrecheckStatusFromEntries(List<GetPrecheckEntry> prechecks) {
    List<PrecheckStatus> statuses = prechecks
        .stream()
        .map(GetPrecheckEntry::status)
        .toList();
    return this.getMergedPrecheckStatus(statuses);
  }

  private PrecheckSeverity getMergedPrecheckSeverity(List<GetPrecheckEntry> prechecks) {
    Optional<PrecheckSeverity> severityOptional = prechecks.stream()
        .filter(precheck -> precheck.status() == PrecheckStatus.FAILED)
        .map(GetPrecheckEntry::severity)
        .filter(severity -> severity == PrecheckSeverity.ERROR)
        .findAny();
    return severityOptional.orElse(PrecheckSeverity.WARNING);
  }

  public void addLog(String precheckRunId, String message) {
    precheckRunRepository.addLog(precheckRunId, message);
  }

  public List<PrecheckRunEntity> getPendingPrechecks(int batchSize) {
    return precheckRunRepository.getPendingPrechecks(batchSize);
  }

  public void updatePrecheckStatus(String id, PrecheckStatus precheckStatus) {
    Update update = new Update().set(PrecheckRunEntity.STATUS, precheckStatus);
    if (precheckStatus == PrecheckStatus.RUNNING) {
      update.set(PrecheckRunEntity.START_TIME, new Date());
      update.set(PrecheckRunEntity.LOGS, new LinkedList<>());
    } else if (precheckStatus == PrecheckStatus.PENDING) {
      update.set(PrecheckRunEntity.END_TIME, null);
      update.set(PrecheckRunEntity.START_TIME, null);
    } else if (precheckStatus == PrecheckStatus.COMPLETED || precheckStatus == PrecheckStatus.FAILED) {
      update.set(PrecheckRunEntity.END_TIME, new Date());
    }
    precheckRunRepository.updateById(id, update);
  }

  public boolean precheckExistsForJob(String upgradeJobId) {
    return precheckRunRepository.getCountByJobId(upgradeJobId) > 0;
  }

  public GetPrecheckSummaryResponse getSummary(String clusterId) {
    var job = clusterUpgradeJobService.getLatestJobByClusterId(clusterId);
    var counts = precheckRunRepository.findStatusAndSeverityByUpgradeJobId(job.getId()).stream()
        .filter(p -> p.status() == PrecheckStatus.FAILED)
        .collect(Collectors.groupingBy(
            PrecheckStatusAndSeverityView::severity,
            Collectors.counting()
        ));
    return new GetPrecheckSummaryResponse(
        counts.getOrDefault(PrecheckSeverity.ERROR, 0L),
        counts.getOrDefault(PrecheckSeverity.WARNING, 0L),
        counts.getOrDefault(PrecheckSeverity.SKIPPED, 0L)
    );
  }

  public SkipPrecheckResponse skipPrecheck(String id, boolean skip) {
    PrecheckSeverity severity;
    PrecheckRunEntity precheckRun = precheckRunRepository.findById(id).orElseThrow();
    Precheck<?> precheck = precheckRegistry.getById(precheckRun.getPrecheckId()).orElseThrow();
    if (skip) {
      if (!precheck.skippable()) {
        throw new AppException("You cannot skip this precheck +[" + precheck.getName() + "]", HttpStatus.NOT_ACCEPTABLE);
      }
      severity = PrecheckSeverity.SKIPPED;
    } else {
      severity = precheck.getSeverity();
    }

    Update update = new Update().set(PrecheckRunEntity.SEVERITY, severity);
    precheckRunRepository.updateById(id, update);
    notificationService.sendNotification(new PrecheckProgressChangeEvent());
    return new SkipPrecheckResponse();
  }
}