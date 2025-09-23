package co.hyperflex.precheck.registry;

import co.hyperflex.precheck.core.Precheck;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class PrecheckAutoRegistrar {

  public PrecheckAutoRegistrar(List<Precheck<?>> discoveredPrechecks, PrecheckRegistry registry) {
    for (Precheck<?> precheck : discoveredPrechecks) {
      registry.register(precheck);
    }
  }

}