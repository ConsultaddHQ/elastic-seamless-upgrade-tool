package co.hyperflex.clients.kibana.dto;

public record GetKibanaStatusResponse(Version version,
                                      KibanaNodeMetrics metrics) {
}
