package co.hyperflex.clients.elastic.dto.cluster;


import jakarta.annotation.Nullable;

public class ClusterNodeCount {
  private int coordinatingOnly;
  private int data;
  private int dataCold;
  private int dataContent;
  @Nullable
  private Integer dataFrozen;
  private int dataHot;
  private int dataWarm;
  private int ingest;
  private int master;
  private int ml;
  private int remoteClusterClient;
  private int total;
  private int transform;
  private int votingOnly;

  public int getCoordinatingOnly() {
    return coordinatingOnly;
  }

  public void setCoordinatingOnly(int coordinatingOnly) {
    this.coordinatingOnly = coordinatingOnly;
  }

  public int getData() {
    return data;
  }

  public void setData(int data) {
    this.data = data;
  }

  public int getDataCold() {
    return dataCold;
  }

  public void setDataCold(int dataCold) {
    this.dataCold = dataCold;
  }

  public int getDataContent() {
    return dataContent;
  }

  public void setDataContent(int dataContent) {
    this.dataContent = dataContent;
  }

  @Nullable
  public Integer getDataFrozen() {
    return dataFrozen;
  }

  public void setDataFrozen(@Nullable Integer dataFrozen) {
    this.dataFrozen = dataFrozen;
  }

  public int getDataHot() {
    return dataHot;
  }

  public void setDataHot(int dataHot) {
    this.dataHot = dataHot;
  }

  public int getDataWarm() {
    return dataWarm;
  }

  public void setDataWarm(int dataWarm) {
    this.dataWarm = dataWarm;
  }

  public int getIngest() {
    return ingest;
  }

  public void setIngest(int ingest) {
    this.ingest = ingest;
  }

  public int getMaster() {
    return master;
  }

  public void setMaster(int master) {
    this.master = master;
  }

  public int getMl() {
    return ml;
  }

  public void setMl(int ml) {
    this.ml = ml;
  }

  public int getRemoteClusterClient() {
    return remoteClusterClient;
  }

  public void setRemoteClusterClient(int remoteClusterClient) {
    this.remoteClusterClient = remoteClusterClient;
  }

  public int getTotal() {
    return total;
  }

  public void setTotal(int total) {
    this.total = total;
  }

  public int getTransform() {
    return transform;
  }

  public void setTransform(int transform) {
    this.transform = transform;
  }

  public int getVotingOnly() {
    return votingOnly;
  }

  public void setVotingOnly(int votingOnly) {
    this.votingOnly = votingOnly;
  }
}
