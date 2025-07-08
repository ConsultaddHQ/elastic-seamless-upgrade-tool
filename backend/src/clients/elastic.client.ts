import { Client } from "@elastic/elasticsearch";
import { BasicAuth, ApiKeyAuth, BearerAuth } from "@elastic/transport/lib/types";
import { ElasticClusterBaseRequest } from "..";
import { getClusterInfoById } from "../services/cluster-info.service";
import logger from "../logger/logger";

export interface ElastcSearchSnapshot {
	createdAt: Date;
	name: string;
}

export interface ElasticClusterInfo {
	url: string;
	apiKey?: string;
	username?: string;
	password?: string;
	bearer?: string;
}

export class ElasticClient {
	config: ElasticClusterInfo;

	constructor(config: ElasticClusterInfo) {
		this.config = config;
	}

	getClient() {
		const auth = this.getAuthDetail();
		if (auth) {
			return new Client({
				node: this.config.url,
				auth: this.getAuthDetail(),
				tls: {
					rejectUnauthorized: false, // Disables certificate validation
				},
			});
		} else {
			return new Client({
				node: this.config.url,
				tls: {
					rejectUnauthorized: false, // Disables certificate validation
				},
			});
		}
	}

	async getAllIndexNames(): Promise<string[]> {
		try {
			const response = await this.getClient().cat.indices({
				format: "json",
			});
			return response.map((index: any) => index.index);
		} catch (error) {
			logger.error("Failed to fetch indices", error);
			return [];
		}
	}

	getAuthDetail(): BasicAuth | ApiKeyAuth | BearerAuth | undefined {
		if (this.config.apiKey) {
			return {
				apiKey: this.config.apiKey,
			};
		} else if (this.config.bearer) {
			return {
				bearer: this.config.bearer,
			};
		} else if (this.config.username && this.config.password) {
			return {
				username: this.config.username,
				password: this.config.password,
			};
		} else {
			return undefined;
		}
	}

	async getClusterhealth() {
		try {
			const res = await this.getClient().cat.health();
			return res;
		} catch (err) {
			logger.error(`Failed to get cluster health`, err);
			throw err;
		}
	}

	async getValidSnapshots(): Promise<ElastcSearchSnapshot[]> {
		try {
			const client = this.getClient();
			const repositoriesResponse = await client.snapshot.getRepository({});
			const repositories: string[] = Object.keys(repositoriesResponse);

			if (repositories.length === 0) {
				logger.info("No repositories found.");
				return [];
			}

			const now = Date.now();
			const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000; // Timestamp for 24 hours ago

			const snapshots: ElastcSearchSnapshot[][] = await Promise.all(
				repositories.map(async (repository: string) => {
					try {
						logger.info(`Checking snapshots for repository: ${repository}`);
						const snapshotResponse = await client.snapshot.get({
							repository,
							snapshot: "_all",
						});
						const snapshots = snapshotResponse.snapshots;

						if (!snapshots || snapshots.length === 0) {
							logger.info(`No snapshots found in repository ${repository}.`);
							return [];
						}
						return snapshots
							.filter((snapshot) => {
								const snapshotTime = snapshot.start_time_in_millis || -1;
								return snapshotTime >= twentyFourHoursAgo && snapshotTime <= now;
							})
							.map(
								(snapshot) =>
									({
										createdAt: new Date(snapshot.start_time_in_millis!!),
										name: snapshot.snapshot,
									}) as ElastcSearchSnapshot
							);
					} catch (err) {
						logger.error(`Error fetching snapshots for repository ${repository}:`, err);
						return [];
					}
				})
			);

			const validSnapshots = snapshots.reduce((acc, current) => [...acc, ...current], []);
			if (validSnapshots.length === 0) {
				logger.info("No valid snapshots found within the last 24 hours.");
			}
			return validSnapshots;
		} catch (error) {
			logger.error("Error checking snapshot details:", error);
			throw error;
		}
	}

	async getSetting() {
		return await this.getClient().cluster.getSettings();
	}

	async getMasterNodes() {
		return await this.getClient().cat.master({
			format: "json",
		});
	}

	async getElasticsearchVersion() {
		try {
			const body = await this.getClient().info();
			return body.version.number;
		} catch (error) {
			logger.error("Error fetching Elasticsearch version:", error);
			throw error;
		}
	}

	static async buildClient(clusterId: string) {
		const cluterInfo = await getClusterInfoById(clusterId);
		const body: ElasticClusterBaseRequest = {
			url: cluterInfo.elastic?.url!!,
			ssl: {},
			username: cluterInfo.elastic?.username!!,
			password: cluterInfo.elastic?.password!!,
		};
		return new ElasticClient(body);
	}
}
