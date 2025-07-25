package co.hyperflex.services;

import co.hyperflex.dtos.prechecks.GetGroupedPrecheckResponseModels;
import co.hyperflex.dtos.prechecks.GetGroupedPrecheckResponseModels.GetClusterPrecheckEntry;
import co.hyperflex.dtos.prechecks.GetGroupedPrecheckResponseModels.GetIndexPrecheckGroup;
import co.hyperflex.dtos.prechecks.GetGroupedPrecheckResponseModels.GetNodePrecheckGroup;
import co.hyperflex.dtos.prechecks.GetGroupedPrecheckResponseModels.GetPrecheckEntry;
import co.hyperflex.dtos.prechecks.PrecheckRerunRequest;
import co.hyperflex.entities.precheck.ClusterPrecheckRun;
import co.hyperflex.entities.precheck.IndexPrecheckRun;
import co.hyperflex.entities.precheck.NodePrecheckRun;
import co.hyperflex.entities.precheck.PrecheckRun;
import co.hyperflex.entities.precheck.PrecheckStatus;
import co.hyperflex.exceptions.NotFoundException;
import co.hyperflex.repositories.PrecheckGroupRepository;
import co.hyperflex.repositories.PrecheckRunRepository;
import java.util.Collections;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

@Service
public class PrecheckRunService {

  private final PrecheckRunRepository precheckRunRepository;
  private final PrecheckGroupRepository precheckGroupRepository;
  private final MongoTemplate mongoTemplate;

  public PrecheckRunService(PrecheckRunRepository precheckRunRepository,
                            PrecheckGroupRepository precheckGroupRepository,
                            MongoTemplate mongoTemplate) {
    this.precheckRunRepository = precheckRunRepository;
    this.precheckGroupRepository = precheckGroupRepository;
    this.mongoTemplate = mongoTemplate;
  }

  public GetGroupedPrecheckResponseModels.GetGroupedPrecheckResponse getGroupedPrecheckByClusterId(
      String clusterId) {

    return precheckGroupRepository.findFirstByClusterIdOrderByCreatedAtDesc(clusterId)
        .map(precheckGroup -> {
          List<PrecheckRun> precheckRuns =
              precheckRunRepository.findByPrecheckGroupId(precheckGroup.getId());

          Map<String, List<GetPrecheckEntry>> nodePrechecks = precheckRuns.stream()
              .filter(pr -> pr instanceof NodePrecheckRun)
              .map(pr -> (NodePrecheckRun) pr)
              .collect(Collectors.groupingBy(
                  pr -> pr.getNode().getId(),
                  Collectors.mapping(this::toPrecheckEntry, Collectors.toList())
              ));

          Map<String, List<GetPrecheckEntry>> indexPrechecks = precheckRuns.stream()
              .filter(pr -> pr instanceof IndexPrecheckRun)
              .map(pr -> (IndexPrecheckRun) pr)
              .collect(Collectors.groupingBy(
                  pr -> pr.getIndex().getName(),
                  Collectors.mapping(this::toPrecheckEntry, Collectors.toList())
              ));

          List<GetClusterPrecheckEntry> clusterPrechecks = precheckRuns.stream()
              .filter(pr -> pr instanceof ClusterPrecheckRun)
              .map(this::toClusterPrecheckEntry)
              .toList();

          List<GetNodePrecheckGroup> nodeGroups = nodePrechecks.entrySet().stream()
              .map(entry -> {
                NodePrecheckRun.NodeInfo nodeInfo = ((NodePrecheckRun) precheckRuns.stream()
                    .filter(pr -> pr instanceof NodePrecheckRun && ((NodePrecheckRun) pr).getNode()
                        .getId().equals(entry.getKey()))
                    .findFirst()
                    .orElseThrow()).getNode();
                PrecheckStatus status = entry.getValue().stream()
                    .anyMatch(p -> PrecheckStatus.FAILED == p.status()) ? PrecheckStatus.FAILED :
                    PrecheckStatus.PASSED;
                return new GetNodePrecheckGroup(
                    nodeInfo.getId(),
                    nodeInfo.getIp(),
                    nodeInfo.getName(),
                    status,
                    entry.getValue()
                );
              })
              .toList();

          List<GetIndexPrecheckGroup> indexGroups = indexPrechecks.entrySet().stream()
              .map(entry -> {
                PrecheckStatus status = entry.getValue().stream()
                    .anyMatch(p -> PrecheckStatus.FAILED == p.status()) ? PrecheckStatus.FAILED :
                    PrecheckStatus.PASSED;
                return new GetIndexPrecheckGroup(
                    entry.getKey(),
                    entry.getKey(),
                    status,
                    entry.getValue()
                );
              })
              .toList();

          return new GetGroupedPrecheckResponseModels.GetGroupedPrecheckResponse(
              nodeGroups,
              clusterPrechecks,
              indexGroups,
              Collections.emptyList()
          );
        })
        .orElseThrow(() -> new NotFoundException("No PrecheckRun found for cluster: " + clusterId));
  }

  private GetPrecheckEntry toPrecheckEntry(PrecheckRun precheckRun) {
    long duration = 0;
    if (precheckRun.getStartedAt() != null && precheckRun.getEndAt() != null) {
      duration = precheckRun.getEndAt().getTime() - precheckRun.getStartedAt().getTime();
    }
    return new GetPrecheckEntry(
        precheckRun.getId(),
        precheckRun.getName(),
        precheckRun.getStatus(),
        precheckRun.getLogs(),
        duration
    );
  }

  private GetClusterPrecheckEntry toClusterPrecheckEntry(PrecheckRun precheckRun) {
    long duration = 0;
    if (precheckRun.getStartedAt() != null && precheckRun.getEndAt() != null) {
      duration = precheckRun.getEndAt().getTime() - precheckRun.getStartedAt().getTime();
    }
    return new GetClusterPrecheckEntry(
        precheckRun.getPrecheckId(),
        precheckRun.getName(),
        precheckRun.getStatus(),
        precheckRun.getLogs(),
        duration
    );
  }


  public void rerunPrechecks(String precheckGroupId, PrecheckRerunRequest request) {
    List<Criteria> criteriaList = new LinkedList<>();

    if (request.precheckIds() != null && !request.precheckIds().isEmpty()) {
      criteriaList.add(Criteria.where("_id").in(request.precheckIds()));
    }

    if (request.nodeIds() != null && !request.nodeIds().isEmpty()) {
      criteriaList.add(Criteria.where("node.id").in(request.nodeIds()));
    }

    if (request.indexNames() != null && !request.indexNames().isEmpty()) {
      criteriaList.add(Criteria.where("index.name").in(request.indexNames()));
    }

    if (criteriaList.isEmpty()) {
      return; // nothing to update
    }

    Query query = new Query(new Criteria().orOperator(criteriaList));
    Update update = new Update()
        .set("status", PrecheckStatus.PENDING)
        .set("startedAt", null)
        .set("endAt", null);
    mongoTemplate.updateMulti(query, update, PrecheckRun.class);
  }
}