package co.hyperflex.services;

import co.hyperflex.dtos.upgrades.GetUpgradeLogsRequest;
import co.hyperflex.dtos.upgrades.GetUpgradeLogsResponse;
import co.hyperflex.entities.upgrade.ClusterUpgradeJob;
import co.hyperflex.entities.upgrade.UpgradeLog;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

@Service
public class UpgradeLogService {
  private final MongoTemplate mongoTemplate;
  private final ClusterUpgradeJobService clusterUpgradeJobService;

  public UpgradeLogService(MongoTemplate mongoTemplate, ClusterUpgradeJobService clusterUpgradeJobService) {
    this.mongoTemplate = mongoTemplate;
    this.clusterUpgradeJobService = clusterUpgradeJobService;
  }

  public void addLog(String jobId, String nodeId, String message) {
    Query query = new Query(Criteria.where(UpgradeLog.CLUSTER_UPGRADE_JOB_ID).is(jobId).and(UpgradeLog.NODE_ID).is(nodeId));
    Update update = new Update()
        .push(UpgradeLog.LOGS, "[" + LocalDateTime.now() + "] " + message)
        .setOnInsert(UpgradeLog.CLUSTER_UPGRADE_JOB_ID, jobId)
        .setOnInsert(UpgradeLog.NODE_ID, nodeId);
    mongoTemplate.upsert(query, update, UpgradeLog.class);
  }

  public GetUpgradeLogsResponse getLogs(GetUpgradeLogsRequest request) {
    ClusterUpgradeJob job = clusterUpgradeJobService.getLatestJobByClusterId(request.clusterId());
    Query query = new Query(
        Criteria.where(UpgradeLog.NODE_ID).is(request.nodeId())
            .and(UpgradeLog.CLUSTER_UPGRADE_JOB_ID).is(job.getId()));
    UpgradeLog upgradeLog = mongoTemplate.findOne(query, UpgradeLog.class);
    return new GetUpgradeLogsResponse(Optional.ofNullable(upgradeLog).map(UpgradeLog::getLogs).orElse(List.of()));
  }

}

