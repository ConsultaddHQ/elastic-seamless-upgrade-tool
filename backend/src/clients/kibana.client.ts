import { IKibanaInfo } from "../models/cluster-info.model";
import { getClusterInfoById } from "../services/cluster-info.service";
import axios from "axios";

export interface DeprecationDetail {
	configPath: string;
	title: string;
	level: "warning" | "critical";
	message: string;
	correctiveActions: {
		manualSteps: string[];
	};
	deprecationType: string;
	requireRestart: boolean;
	domainId: string;
}

export class KibanaClient {
	config: IKibanaInfo;

	constructor(config: IKibanaInfo) {
		this.config = config;
	}

	async getDeprecations(): Promise<DeprecationDetail[]> {
		try {
			const response = await axios.get(`${this.config.url}/api/deprecations/`, {
				headers: {
					Authorization: this.getAuthDetail(),
					"kbn-xsrf": "true",
				},
			});
			return response.data.deprecations as DeprecationDetail[];
		} catch (error: any) {
			console.error("Error fetching deprecations:", error.response?.data || error.message);
			throw error;
		}
	}
	async getKibanaVersion(ip?: string): Promise<string | undefined> {
		const url = ip ? `http://${ip}:5601` : this.config.url;
		const response = await axios.get(`${url}/api/status`, {
			headers: {
				Authorization: this.getAuthDetail(),
				"kbn-xsrf": "true",
			},
		});
		return response.data?.version?.number;
	}

	async getKibanaNodeDetails(nodeIp: string): Promise<{ version: string; os: Record<string, any>; roles: string[] }> {
		try {
			const response = await axios.get(`http://${nodeIp}:5601/api/status`, {
				headers: {
					Authorization: this.getAuthDetail(),
					"kbn-xsrf": "true",
				},
			});

			const version = response.data.version.number;
			const os = response?.data?.os?.platform
				? {
						name: response.data.os.platform,
						version: response.data.os.platformRelease,
					}
				: {
						name: "Linux",
						version: "linux-6.8.0-1021-aws",
					};
			const roles = ["kibana"];

			return { version, os, roles };
		} catch (error) {
			console.error("Error getting Kibana node details:", error);
			throw error;
		}
	}
	getAuthDetail(): string | undefined {
		const { username, password, apiKey } = this.config;
		if (username && password) {
			if (!username || !password) {
				throw new Error("Username and password must be provided for Basic Authentication.");
			}
			const token = Buffer.from(`${username}:${password}`).toString("base64");
			return `Basic ${token}`;
		} else if (apiKey) {
			return `ApiKey ${apiKey}`;
		}
	}

	static async buildClient(clusterId: string) {
		const cluterInfo = await getClusterInfoById(clusterId);
		if (!cluterInfo.kibana) {
			throw new Error("Kibana config not found");
		}
		return new KibanaClient(cluterInfo.kibana);
	}
}
