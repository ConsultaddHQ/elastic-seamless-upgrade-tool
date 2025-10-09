import axiosJSON from "../http"

class ClusterUpgradeApi {
	async setTargetVersion(clusterId: string, targetVersion: string) {
		const response = await axiosJSON.post(`/clusters/${clusterId}/upgrades/jobs`, {
			targetVersion,
		})
		return response.data
	}

	async getTargetVersionInfo(clusterId: string) {
		const response = await axiosJSON.get(`/clusters/${clusterId}/upgrades/jobs/target-version`)
		return response.data
	}

	async getInfo(clusterId: string) {
		const response = await axiosJSON.get(`/clusters/${clusterId}/upgrades/info`)
		return response.data
	}
	async getUpgradeLogs(clusterId: string, nodeId: string) {
		const response = await axiosJSON.get(`/clusters/${clusterId}/upgrades/nodes/${nodeId}/logs`)
		return response.data.logs ?? []
	}

	async stopUpgrade(clusterId: string) {
		const response = await axiosJSON.put(`/clusters/${clusterId}/upgrades/jobs/stop`)
		return response.data
	}

	async upgradeNode(clusterId: string, nodeId: string) {
		const response = await axiosJSON.post(`/clusters/${clusterId}/upgrades/nodes/${nodeId}`)
		return response.data
	}

  async upgradeAllNodes(clusterId: string, nodeType: string) {
    const response = await axiosJSON.post(`/clusters/${clusterId}/upgrades?nodeType=${nodeType}`);
    return response.data;
  }
	
  async getUpgradeJobStatus(clusterId: string) {
		const response = await axiosJSON.get<{
			isStopping: true
			status: string
		}>(`/clusters/${clusterId}/upgrades/jobs/status`)
		return response.data
	}
}

export const clusterUpgradeApi = new ClusterUpgradeApi()
