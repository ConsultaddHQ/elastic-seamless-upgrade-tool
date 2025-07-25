package co.hyperflex.dtos.prechecks;

import jakarta.annotation.Nullable;
import java.util.List;

public record PrecheckRerunRequest(@Nullable List<String> nodeIds,
                                   @Nullable List<String> indexNames,
                                   @Nullable List<String> precheckIds) {

}
