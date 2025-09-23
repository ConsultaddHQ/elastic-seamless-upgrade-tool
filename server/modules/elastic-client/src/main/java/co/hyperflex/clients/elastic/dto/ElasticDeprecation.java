package co.hyperflex.clients.elastic.dto;

public record ElasticDeprecation(
    String details,
    String level,
    String message,
    String url
) {
}
