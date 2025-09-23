package co.hyperflex.clients.elastic.dto.cluster.health;

import com.fasterxml.jackson.annotation.JsonProperty;

public class ClusterHealthResponse {

  @JsonProperty("cluster_name")
  private String clusterName;

  private String status;

  @JsonProperty("timed_out")
  private boolean timedOut;

  @JsonProperty("number_of_nodes")
  private int numberOfNodes;

  @JsonProperty("number_of_data_nodes")
  private int numberOfDataNodes;

  @JsonProperty("active_primary_shards")
  private int activePrimaryShards;

  @JsonProperty("active_shards")
  private int activeShards;

  @JsonProperty("relocating_shards")
  private int relocatingShards;

  @JsonProperty("initializing_shards")
  private int initializingShards;

  @JsonProperty("unassigned_shards")
  private int unassignedShards;

  @JsonProperty("delayed_unassigned_shards")
  private int delayedUnassignedShards;

  @JsonProperty("number_of_pending_tasks")
  private int numberOfPendingTasks;

  @JsonProperty("number_of_in_flight_fetch")
  private int numberOfInFlightFetch;

  @JsonProperty("task_max_waiting_in_queue_millis")
  private long taskMaxWaitingInQueueMillis;

  @JsonProperty("active_shards_percent_as_number")
  private double activeShardsPercentAsNumber;

  // Getters and Setters
  public String getClusterName() {
    return clusterName;
  }

  public void setClusterName(String clusterName) {
    this.clusterName = clusterName;
  }

  public String getStatus() {
    return status;
  }

  public void setStatus(String status) {
    this.status = status;
  }

  public boolean isTimedOut() {
    return timedOut;
  }

  public void setTimedOut(boolean timedOut) {
    this.timedOut = timedOut;
  }

  public int getNumberOfNodes() {
    return numberOfNodes;
  }

  public void setNumberOfNodes(int numberOfNodes) {
    this.numberOfNodes = numberOfNodes;
  }

  public int getNumberOfDataNodes() {
    return numberOfDataNodes;
  }

  public void setNumberOfDataNodes(int numberOfDataNodes) {
    this.numberOfDataNodes = numberOfDataNodes;
  }

  public int getActivePrimaryShards() {
    return activePrimaryShards;
  }

  public void setActivePrimaryShards(int activePrimaryShards) {
    this.activePrimaryShards = activePrimaryShards;
  }

  public int getActiveShards() {
    return activeShards;
  }

  public void setActiveShards(int activeShards) {
    this.activeShards = activeShards;
  }

  public int getRelocatingShards() {
    return relocatingShards;
  }

  public void setRelocatingShards(int relocatingShards) {
    this.relocatingShards = relocatingShards;
  }

  public int getInitializingShards() {
    return initializingShards;
  }

  public void setInitializingShards(int initializingShards) {
    this.initializingShards = initializingShards;
  }

  public int getUnassignedShards() {
    return unassignedShards;
  }

  public void setUnassignedShards(int unassignedShards) {
    this.unassignedShards = unassignedShards;
  }

  public int getDelayedUnassignedShards() {
    return delayedUnassignedShards;
  }

  public void setDelayedUnassignedShards(int delayedUnassignedShards) {
    this.delayedUnassignedShards = delayedUnassignedShards;
  }

  public int getNumberOfPendingTasks() {
    return numberOfPendingTasks;
  }

  public void setNumberOfPendingTasks(int numberOfPendingTasks) {
    this.numberOfPendingTasks = numberOfPendingTasks;
  }

  public int getNumberOfInFlightFetch() {
    return numberOfInFlightFetch;
  }

  public void setNumberOfInFlightFetch(int numberOfInFlightFetch) {
    this.numberOfInFlightFetch = numberOfInFlightFetch;
  }

  public long getTaskMaxWaitingInQueueMillis() {
    return taskMaxWaitingInQueueMillis;
  }

  public void setTaskMaxWaitingInQueueMillis(long taskMaxWaitingInQueueMillis) {
    this.taskMaxWaitingInQueueMillis = taskMaxWaitingInQueueMillis;
  }

  public double getActiveShardsPercentAsNumber() {
    return activeShardsPercentAsNumber;
  }

  public void setActiveShardsPercentAsNumber(double activeShardsPercentAsNumber) {
    this.activeShardsPercentAsNumber = activeShardsPercentAsNumber;
  }
}
