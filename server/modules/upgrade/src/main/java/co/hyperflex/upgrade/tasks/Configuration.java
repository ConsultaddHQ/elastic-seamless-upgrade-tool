package co.hyperflex.upgrade.tasks;

import co.hyperflex.core.models.clusters.SshInfo;

public record Configuration(int esTransportPort, int esHttpPort, SshInfo sshInfo,
                            String targetVersion) {
}
