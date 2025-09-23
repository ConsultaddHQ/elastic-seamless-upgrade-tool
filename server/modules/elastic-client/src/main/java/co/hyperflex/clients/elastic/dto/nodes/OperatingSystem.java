package co.hyperflex.clients.elastic.dto.nodes;

public class OperatingSystem {
  private Cpu cpu;
  private ExtendedMemoryStats mem;

  public Cpu getCpu() {
    return cpu;
  }

  public void setCpu(Cpu cpu) {
    this.cpu = cpu;
  }

  public ExtendedMemoryStats getMem() {
    return mem;
  }

  public void setMem(ExtendedMemoryStats mem) {
    this.mem = mem;
  }
}
