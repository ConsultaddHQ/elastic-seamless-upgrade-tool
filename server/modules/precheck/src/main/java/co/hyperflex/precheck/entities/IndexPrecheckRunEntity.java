package co.hyperflex.precheck.entities;

import co.hyperflex.precheck.core.enums.PrecheckType;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "prechecks")
public class IndexPrecheckRunEntity extends PrecheckRunEntity {
  private IndexInfo index;

  public IndexPrecheckRunEntity() {
    setType(PrecheckType.INDEX);
  }

  public IndexInfo getIndex() {
    return index;
  }

  public void setIndex(IndexInfo index) {
    this.index = index;
  }

  public static class IndexInfo {
    private String name;

    public IndexInfo() {
    }

    public IndexInfo(String name) {
      this.name = name;
    }

    public String getName() {
      return name;
    }

    public void setName(String name) {
      this.name = name;
    }
  }
}