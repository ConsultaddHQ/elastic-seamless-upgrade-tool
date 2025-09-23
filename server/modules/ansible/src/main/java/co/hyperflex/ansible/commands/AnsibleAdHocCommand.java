package co.hyperflex.ansible.commands;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;

public class AnsibleAdHocCommand {
  private final Map<String, Object> args;
  private final String module;

  public AnsibleAdHocCommand(Map<String, Object> args, String module) {
    this.args = args;
    this.module = module;
  }

  public static Builder builder() {
    return new Builder();
  }

  public String getModule() {
    return module;
  }

  public List<String> getArguments() {
    if (args == null) {
      return Collections.emptyList();
    }
    return args.entrySet().stream().map(entry -> entry.getKey() + "=" + entry.getValue()).toList();
  }

  public static class Builder {
    private Map<String, Object> args;
    private String module;

    public Builder args(Map<String, Object> args) {
      this.args = args;
      return this;
    }

    public Builder apt() {
      this.module = "ansible.builtin.apt";
      return this;
    }

    public Builder dnf() {
      this.module = "ansible.builtin.dnf";
      return this;
    }

    public Builder yum() {
      this.module = "ansible.builtin.yum";
      return this;
    }

    public Builder systemd() {
      this.module = "ansible.builtin.systemd";
      return this;
    }

    public Builder aptRepository() {
      this.module = "ansible.builtin.apt_repository";
      return this;
    }

    public Builder module(String module) {
      this.module = module;
      return this;
    }

    public AnsibleAdHocCommand build() {
      Objects.requireNonNull(module, "module is required");
      return new AnsibleAdHocCommand(args, module);
    }

    public Builder yumRepository() {
      this.module = "ansible.builtin.yum_repository";
      return this;
    }
  }
}

