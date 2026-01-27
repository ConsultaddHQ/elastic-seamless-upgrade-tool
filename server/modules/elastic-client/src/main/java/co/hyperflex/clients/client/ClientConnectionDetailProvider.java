package co.hyperflex.clients.client;

import jakarta.validation.constraints.NotNull;

public interface ClientConnectionDetailProvider {
  ClientConnectionDetail getDetail(@NotNull String clusterId);
}
