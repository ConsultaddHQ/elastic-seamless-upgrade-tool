package co.hyperflex.controllers;

import co.hyperflex.precheck.services.PrecheckReportService;
import co.hyperflex.precheck.services.PrecheckRunService;
import co.hyperflex.precheck.services.PrecheckSchedulerService;
import co.hyperflex.precheck.services.dtos.GetBreakingChangeEntry;
import co.hyperflex.precheck.services.dtos.GetGroupedPrecheckResponse;
import co.hyperflex.precheck.services.dtos.GetIndexPrecheckGroup;
import co.hyperflex.precheck.services.dtos.GetNodePrecheckGroup;
import co.hyperflex.precheck.services.dtos.GetPrecheckEntry;
import co.hyperflex.precheck.services.dtos.GetPrecheckSummaryResponse;
import co.hyperflex.precheck.services.dtos.PrecheckRerunRequest;
import co.hyperflex.precheck.services.dtos.PrecheckScheduleResponse;
import co.hyperflex.precheck.services.dtos.SkipPrecheckResponse;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/clusters/{clusterId}/prechecks")
public class PrecheckController {

  private final PrecheckSchedulerService scheduler;
  private final PrecheckRunService precheckRunService;
  private final PrecheckReportService precheckReportService;

  public PrecheckController(PrecheckSchedulerService scheduler,
                            PrecheckRunService precheckRunService,
                            PrecheckReportService precheckReportService) {
    this.scheduler = scheduler;
    this.precheckRunService = precheckRunService;
    this.precheckReportService = precheckReportService;
  }

  @PostMapping()
  public PrecheckScheduleResponse runAll(@PathVariable String clusterId) {
    return scheduler.schedule(clusterId);
  }

  @PutMapping("/{id}/skip")
  public SkipPrecheckResponse skip(@PathVariable String clusterId, @PathVariable String id, @RequestParam boolean skip) {
    return precheckRunService.skipPrecheck(id, skip);
  }

  @PostMapping("/rerun")
  public PrecheckScheduleResponse rerunCluster(@PathVariable String clusterId,
                                               @Valid @RequestBody PrecheckRerunRequest request) {

    return scheduler.rerunPrechecks(clusterId, request);
  }

  @GetMapping()
  public GetGroupedPrecheckResponse getGroupedPrechecks(@PathVariable String clusterId) {
    return precheckRunService.getGroupedPrecheckByClusterId(clusterId);
  }

  @GetMapping("/node")
  public List<GetNodePrecheckGroup> getNodePrecheckGroups(@PathVariable String clusterId) {
    return precheckRunService.getNodePrecheckGroups(clusterId);
  }

  @GetMapping("/index")
  public List<GetIndexPrecheckGroup> getIndexPrecheckGroups(@PathVariable String clusterId) {
    return precheckRunService.getIndexPrecheckGroups(clusterId);
  }

  @GetMapping("/cluster")
  public List<GetPrecheckEntry> getClusterPrecheckGroups(@PathVariable String clusterId) {
    return precheckRunService.getClusterPrechecks(clusterId);
  }

  @GetMapping("/breaking-changes")
  public List<GetBreakingChangeEntry> getBreakingChanges(@PathVariable String clusterId) {
    return precheckRunService.getBreakingChanges(clusterId);
  }

  @GetMapping("/summary")
  public GetPrecheckSummaryResponse getPrecheckSummary(@PathVariable String clusterId) {
    return precheckRunService.getSummary(clusterId);
  }

  @GetMapping("/report")
  public String getReport(@PathVariable String clusterId) {
    return precheckReportService.generatePrecheckReportMdContent(clusterId);
  }

}