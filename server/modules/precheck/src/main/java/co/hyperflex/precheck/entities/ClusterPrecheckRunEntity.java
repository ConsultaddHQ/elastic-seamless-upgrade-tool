package co.hyperflex.precheck.entities;

import co.hyperflex.precheck.core.enums.PrecheckType;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "prechecks")
public class ClusterPrecheckRunEntity extends PrecheckRunEntity {
  public ClusterPrecheckRunEntity() {
    setType(PrecheckType.CLUSTER);
  }
}