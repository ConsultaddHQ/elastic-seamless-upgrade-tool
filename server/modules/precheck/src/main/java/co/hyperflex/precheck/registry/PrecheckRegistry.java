package co.hyperflex.precheck.registry;

import co.hyperflex.precheck.core.Precheck;
import co.hyperflex.precheck.core.enums.PrecheckType;
import java.util.ArrayList;
import java.util.Collection;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;

@Component
public class PrecheckRegistry {
  private final Map<String, Precheck<?>> prechecks = new ConcurrentHashMap<>();
  private final Map<PrecheckType, List<Precheck<?>>> prechecksByType =
      new EnumMap<>(PrecheckType.class);

  public void register(Precheck<?> precheck) {
    prechecks.put(precheck.getId(), precheck);
    prechecksByType
        .computeIfAbsent(precheck.getType(), t -> new ArrayList<>())
        .add(precheck);
  }

  public Optional<Precheck<?>> getById(String id) {
    return Optional.ofNullable(prechecks.get(id));
  }

  public Collection<Precheck<?>> getAll() {
    return prechecks.values();
  }

  public List<Precheck<?>> getByType(PrecheckType type) {
    return prechecksByType.getOrDefault(type, List.of());
  }

  public List<Precheck<?>> getClusterPrechecks() {
    return getByType(PrecheckType.CLUSTER);
  }

  public List<Precheck<?>> getNodePrechecks() {
    return getByType(PrecheckType.NODE);
  }

  public List<Precheck<?>> getIndexPrechecks() {
    return getByType(PrecheckType.INDEX);
  }
}
