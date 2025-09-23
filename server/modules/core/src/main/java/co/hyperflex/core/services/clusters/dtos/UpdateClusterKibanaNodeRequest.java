package co.hyperflex.core.services.clusters.dtos;

/**
 * Represents a request to update a Kibana node in a cluster.
 *
 * <p>
 * This record encapsulates information regarding a specific Kibana node
 * that needs to be updated. It includes details such as the node's
 * unique identifier, name, IP address, and whether the node should be deleted.
 *
 * @param id     The unique identifier of the Kibana node to be updated.
 * @param name   The name of the Kibana node to be updated.
 * @param ip     The IP address of the Kibana node to be updated.
 * @param delete A flag indicating whether the Kibana node should be deleted.
 */
public record UpdateClusterKibanaNodeRequest(String id, String name, String ip, boolean delete) {
}
