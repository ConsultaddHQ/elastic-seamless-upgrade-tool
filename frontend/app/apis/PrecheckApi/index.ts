import axiosJSON from "../http"

class PrecheckApi {
	async rerunPrechecks(clusterId: string, payload: any) {
		const response = await axiosJSON.post(`/clusters/${clusterId}/prechecks/rerun`, payload)
		return response.data
	}

	async skipPrecheck(clusterId: string, precheckId: string, skip: boolean) {
		const response = await axiosJSON.put(`/clusters/${clusterId}/prechecks/${precheckId}/skip?skip=${skip}`)
		return response.data
	}

	async getBreakingChanges(clusterId: string) {
		const response = await axiosJSON.get<TPrecheck[]>(`/clusters/${clusterId}/prechecks/breaking-changes`)
		return response.data
	}

	async getPrechecks(clusterId: string) {
		const response = await axiosJSON.get<{
			index: TIndexData[]
			node: TNodeData[]
			cluster: TPrecheck[]
		}>(`/clusters/${clusterId}/prechecks`)
		return response.data
	}
}

export const precheckApi = new PrecheckApi()
