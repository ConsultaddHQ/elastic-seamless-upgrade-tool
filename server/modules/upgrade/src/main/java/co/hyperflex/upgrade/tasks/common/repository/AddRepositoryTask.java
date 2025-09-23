package co.hyperflex.upgrade.tasks.common.repository;

import co.hyperflex.upgrade.tasks.AbstractAnsibleTask;
import co.hyperflex.upgrade.tasks.Context;
import co.hyperflex.upgrade.tasks.TaskResult;
import org.springframework.stereotype.Component;

@Component
public class AddRepositoryTask extends AbstractAnsibleTask {
  public static final String GPG_KEY_URL = "https://artifacts.elastic.co/GPG-KEY-elasticsearch";
  private final AddAptRepositoryTask addAptRepositoryTask;
  private final AddYumRepositoryTask addYumRepositoryTask;

  public AddRepositoryTask(AddAptRepositoryTask addAptRepositoryTask, AddYumRepositoryTask addYumRepositoryTask) {
    this.addAptRepositoryTask = addAptRepositoryTask;
    this.addYumRepositoryTask = addYumRepositoryTask;
  }

  @Override
  public String getName() {
    return "Setup elastic 8.x repository for package manager";
  }

  @Override
  public TaskResult run(Context context) {
    var task = switch (context.node().getOs().packageManager()) {
      case APT -> addAptRepositoryTask;
      case YUM, DNF -> addYumRepositoryTask;
      case null, default -> throw new IllegalStateException(
          "Unsupported package manager " + context.node().getOs().packageManager()
      );
    };
    return task.run(context);
  }
}