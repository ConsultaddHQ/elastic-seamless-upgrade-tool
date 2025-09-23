package co.hyperflex.clients.elastic.dto.nodes;

public class IngestTotal {
  private long count;
  private long current;
  private long failed;
  private long timeInMillis;

  public long getCount() {
    return count;
  }

  public void setCount(long count) {
    this.count = count;
  }

  public long getCurrent() {
    return current;
  }

  public void setCurrent(long current) {
    this.current = current;
  }

  public long getFailed() {
    return failed;
  }

  public void setFailed(long failed) {
    this.failed = failed;
  }

  public long getTimeInMillis() {
    return timeInMillis;
  }

  public void setTimeInMillis(long timeInMillis) {
    this.timeInMillis = timeInMillis;
  }
}
