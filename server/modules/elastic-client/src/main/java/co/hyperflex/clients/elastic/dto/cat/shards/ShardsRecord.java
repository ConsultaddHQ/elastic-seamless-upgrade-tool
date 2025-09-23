package co.hyperflex.clients.elastic.dto.cat.shards;


public class ShardsRecord {
  private String index;
  private String shard;
  private String prirep;
  private String state;
  private String mergesCurrent;
  private String node;

  public String getIndex() {
    return index;
  }

  public void setIndex(String index) {
    this.index = index;
  }

  public String getShard() {
    return shard;
  }

  public void setShard(String shard) {
    this.shard = shard;
  }

  public String getPrirep() {
    return prirep;
  }

  public void setPrirep(String prirep) {
    this.prirep = prirep;
  }

  public String getState() {
    return state;
  }

  public void setState(String state) {
    this.state = state;
  }

  public String getMergesCurrent() {
    return mergesCurrent;
  }

  public void setMergesCurrent(String mergesCurrent) {
    this.mergesCurrent = mergesCurrent;
  }

  public String getNode() {
    return node;
  }

  public void setNode(String node) {
    this.node = node;
  }
}