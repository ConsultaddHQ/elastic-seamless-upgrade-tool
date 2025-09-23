package co.hyperflex.clients.elastic.dto;

import java.util.Date;

public record GetElasticsearchSnapshotResponse(
    String name,
    Date createdAt
) {
}
