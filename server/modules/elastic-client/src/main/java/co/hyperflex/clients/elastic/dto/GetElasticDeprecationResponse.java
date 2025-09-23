package co.hyperflex.clients.elastic.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.annotation.Nullable;
import java.util.List;
import java.util.Map;

public record GetElasticDeprecationResponse(
    @Nullable @JsonProperty("cluster_settings") List<ElasticDeprecation> clusterSettings,
    @Nullable @JsonProperty("index_settings") Map<String, List<ElasticDeprecation>> indexSettings,
    @Nullable @JsonProperty("data_streams") Map<String, List<ElasticDeprecation>> dataStreams,
    @Nullable @JsonProperty("node_settings") List<ElasticDeprecation> nodeSettings,
    @Nullable @JsonProperty("ml_settings") List<ElasticDeprecation> mlSettings,
    @Nullable @JsonProperty("templates") Map<String, List<ElasticDeprecation>> templates,
    @Nullable @JsonProperty("ilm_policies") Map<String, List<ElasticDeprecation>> ilmPolicies
) {
}
