package co.hyperflex.common.client;

import jakarta.validation.constraints.NotNull;

public interface ClientConnectionDetailProvider {
  ClientConnectionDetail getDetail(@NotNull String clusterId);
}
