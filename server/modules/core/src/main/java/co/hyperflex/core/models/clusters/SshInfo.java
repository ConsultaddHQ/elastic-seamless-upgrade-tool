package co.hyperflex.core.models.clusters;

public record SshInfo(String username, String key, String keyPath, String becomeUser) {
}
