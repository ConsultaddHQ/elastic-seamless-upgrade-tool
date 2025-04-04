import { ChildProcess, spawn } from "child_process";
import fs from "fs";
import { IElasticNode } from "../models/elastic-node.model";
import { IKibanaNode } from "../models/kibana-node.model";
import logger from "../logger/logger";

export const extractESNodeNames = (): string[] => {
	try {
		const inventoryContent = fs.readFileSync("ansible_inventory.ini", "utf-8");
		const lines = inventoryContent.split("\n");
		const nodeNames: string[] = [];
		let inElasticsearchSection = false;

		for (const line of lines) {
			if (line.startsWith("[elasticsearch_master]") || line.startsWith("[elasticsearch_data]")) {
				inElasticsearchSection = true;
				continue;
			}
			if (line.startsWith("[")) {
				inElasticsearchSection = false;
			}

			if (inElasticsearchSection) {
				const match = line.match(/^([a-zA-Z0-9_-]+)\s+ansible_host=/);
				if (match) {
					nodeNames.push(match[1]);
				}
			}
		}

		return nodeNames;
	} catch (error) {
		console.error("Error reading inventory file:", error);
		return [];
	}
};

class AnsibleExecutionManager extends EventTarget {
	private process: ChildProcess | null = null;

	constructor() {
		super();
	}
	public createAnsibleInventory = async (nodes: IElasticNode[], pathToKey: string) => {
		try {
			const roleGroups: Record<"elasticsearch_master" | "elasticsearch_data", string[]> = {
				elasticsearch_master: [],
				elasticsearch_data: [],
			};

			for (const node of nodes) {
				if (node.isMaster === true) {
					roleGroups.elasticsearch_master.push(`${node.name} ansible_host=${node.ip}`);
					continue;
				}
				if (node.roles.includes("data")) {
					roleGroups.elasticsearch_data.push(`${node.name} ansible_host=${node.ip}`);
				}
			}

			const inventoryParts: string[] = [];

			Object.entries(roleGroups).forEach(([group, hosts]) => {
				if (hosts.length > 0) {
					inventoryParts.push(`[${group}]\n${hosts.join("\n")}`);
				}
			});

			const nonEmptyGroups = Object.entries(roleGroups)
				.filter(([_, hosts]) => hosts.length > 0)
				.map(([group]) => group);

			if (nonEmptyGroups.length > 0) {
				inventoryParts.push(`[elasticsearch:children]\n${nonEmptyGroups.join("\n")}`);
			}

			inventoryParts.push(
				`[elasticsearch:vars]\nansible_ssh_user=ubuntu\nansible_ssh_private_key_file=${pathToKey}\nansible_ssh_common_args='-o StrictHostKeyChecking=no'\n`
			);

			const inventoryContent = inventoryParts.join("\n\n");

			await fs.promises.writeFile("ansible/ansible_inventory.ini", inventoryContent, "utf8");

			return inventoryContent;
		} catch (error) {
			console.error("Error creating Ansible inventory:", error);
			throw error;
		}
	};

	public runPlaybook(playbook: string, inventory: string, variables: Record<string, any> = {}): Promise<void> {
		try {
			const extraVars = Object.entries(variables)
				.map(([key, value]) => `${key}=${value}`)
				.join(" ");

			return new Promise((resolve, reject) => {
				try {
					const args = ["-i", inventory, playbook, "-e", extraVars];
					this.process = spawn("ansible-playbook", args, {
						cwd: "/Users/vijay/Projects/elastic-seamless-upgrade-tool/backend/ansible",
					});

					this.process.stdout?.on("data", (data) => {
						console.log(`stdout: ${data}`);
						this.dispatchEvent(new CustomEvent("output", { detail: data.toString() }));
					});

					this.process.stderr?.on("data", (data) => {
						console.error(`stderr: ${data}`);
						this.dispatchEvent(new CustomEvent("error", { detail: data.toString() }));
					});

					this.process.on("close", (code) => {
						if (code === 0) {
							resolve();
						} else {
							console.error(`Ansible playbook exited with code ${code}`);
							// reject(new Error(`Ansible playbook failed with exit code ${code}`));
						}
					});
					this.process.on("uncaughtException", (err) => {
						console.error("Uncaught Exception:", err);
						// Prevent backend crash, but log the issue
					});
					this.process.on("unhandledRejection", (reason, promise) => {
						console.error("Unhandled Rejection at:", promise, "reason:", reason);
						// Prevent backend crash, but log the issue
					});
					this.process.on("error", (err) => {
						console.error(`Failed to start playbook: ${err.message}`);
						// reject(err);
					});
				} catch (error) {
					console.error(`Unexpected error: ${error}`);
					reject(error);
				}
			});
		} catch (error) {
			logger.error(`Playbook execution failed: ${(error as Error).message}`);
			return new Promise((resolve, reject) => {
				reject(`Playbook execution failed: ${(error as Error).message}`);
			});
		}
	}

	///////////////////Kibana////////////////////////
	public createAnsibleInventoryForKibana = async (kibanaNodes: IKibanaNode[], pathToKey: string) => {
		try {
			const roleGroups: Record<"kibana", string[]> = {
				kibana: [],
			};
			const inventoryParts: string[] = [];
			for (const node of kibanaNodes) {
				// Add the Kibana node to the kibana group
				roleGroups.kibana.push(`${node.name} ansible_host=${node.ip}`);
			}
			Object.entries(roleGroups).forEach(([group, hosts]) => {
				if (hosts.length > 0) {
					inventoryParts.push(`[${group}]\n${hosts.join("\n")}`);
				}
			});
			inventoryParts.push(
				`[kibana:vars]\nansible_ssh_user=ubuntu\nansible_ssh_private_key_file=${pathToKey}\nansible_ssh_common_args='-o StrictHostKeyChecking=no'`
			);
			const inventoryContent = inventoryParts.join("\n\n");

			await fs.promises.writeFile("ansible_inventory.ini", inventoryContent, "utf8");
			return inventoryContent;
		} catch (error) {
			console.error("Error creating Ansible inventory:", error);
			throw new Error(`Error creating Ansible inventory: ${(error as Error).message}`);
		}
	};
}

export const ansibleExecutionManager = new AnsibleExecutionManager();
