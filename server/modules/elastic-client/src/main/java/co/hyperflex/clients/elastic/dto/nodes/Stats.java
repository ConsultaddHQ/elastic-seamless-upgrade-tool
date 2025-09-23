package co.hyperflex.clients.elastic.dto.nodes;

public class Stats {
  private Process process;
  private OperatingSystem os;
  private String name;
  private Jvm jvm;
  private Ingest ingest;

  public Process getProcess() {
    return process;
  }

  public void setProcess(Process process) {
    this.process = process;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public OperatingSystem getOs() {
    return os;
  }

  public void setOs(OperatingSystem os) {
    this.os = os;
  }

  public Jvm getJvm() {
    return this.jvm;
  }

  public void setJvm(Jvm jvm) {
    this.jvm = jvm;
  }

  public Ingest getIngest() {
    return ingest;
  }

  public void setIngest(Ingest ingest) {
    this.ingest = ingest;
  }
}
