package co.hyperflex.precheck.mappers;

import co.hyperflex.precheck.entities.PrecheckRunEntity;
import co.hyperflex.precheck.services.dtos.GetPrecheckEntry;
import java.util.Date;
import java.util.Optional;
import org.springframework.stereotype.Service;

@Service
public class PrecheckMapper {

  public GetPrecheckEntry toPrecheckEntry(
      PrecheckRunEntity precheckRun) {
    return new GetPrecheckEntry(
        precheckRun.getId(),
        precheckRun.getName(),
        precheckRun.getStatus(),
        precheckRun.getSeverity(),
        precheckRun.getLogs(),
        getDuration(precheckRun.getStartTime(), precheckRun.getEndTime()),
        precheckRun.isSkippable()
    );
  }

  private String getDuration(Date start, Date end) {
    double duration = 0.0;
    if (start != null) {
      duration =
          (Optional.ofNullable(end).orElse(new Date()).getTime() - start.getTime()) / 1000.0;
    }
    return String.format("%.1f", duration) + "s";
  }

}
