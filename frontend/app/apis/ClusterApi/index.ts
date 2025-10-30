import axiosJSON from "../http"

class ClusterApi {
	async getClusterOverview(clusterId: string) {
		const response = await axiosJSON.get(`/clusters/${clusterId}/overview`)
		return response.data
	}
	async getClusters() {
		const response = await axiosJSON.get<Cluster[]>("/clusters")
		return response.data
	}
	async getCluster(clusterId: string) {
		const response = await axiosJSON.get(`/clusters/${clusterId}`)
		return response.data
	}

	async deleteCluster(clusterId: string) {
		await axiosJSON.delete(`/clusters/${clusterId}`)
	}

	async getClusterPrecheckSummary(clusterId: string) {
		const res = await axiosJSON.get(`/clusters/${clusterId}/prechecks/summary`)
		return res.data
	}

	async getNodes(clusterId: string, type: string) {
		const response = await axiosJSON.get(`/clusters/${clusterId}/nodes?type=${type}`)
		return response.data
	}

	async getNodeConfig(clusterId: string, nodeId: string) {
		const res = await axiosJSON.get(`/clusters/${clusterId}/nodes/${nodeId}/configuration`)
		return res.data.config ?? ""
	}

	async updateNodeConfig({ clusterId, nodeId, config }: { clusterId: string; nodeId: string; config: any }) {
		const res = await axiosJSON.put(`/clusters/${clusterId}/nodes/${nodeId}/configuration`, {
			config,
		})
		return res.data
	}

	async getDeprecationLogs(clusterId: string, type: "ELASTIC" | "KIBANA") {
		const response = await axiosJSON.get(
			`/clusters/${clusterId}/deprecations/${type === "ELASTIC" ? "elastic-search" : "kibana"}`
		)
		return response.data
	}

	async getPrecheckReport(clusterId: string) {
		return await axiosJSON.get(`/clusters/${clusterId}/prechecks/report`, {
			responseType: "blob",
		})
	}

	async updateClusterDetail(clusterId: string, data: any) {
		const res = await axiosJSON.put(`/clusters/${clusterId}`, data)
		return res.data
	}

	async getAllocationExplain(clusterId: string) {
		const res = await axiosJSON.get<IAllocationExplain[]>(`/clusters/${clusterId}/allocation-explanations`)
		return res.data ?? []
	}
}

export const clusterApi = new ClusterApi()
