import fs from "fs";
import { IElasticNode } from "../models/elastic-node.model";
import { IKibanaNode } from "../models/kibana-node.model";
const ENABLE_PASSWORD_AUTH_FOR_SSH = process.env.ENABLE_PASSWORD_AUTH_FOR_SSH === "true";

class AnsibleInventoryService {
	constructor() {}
	public createAnsibleInventory = async (
		nodes: IElasticNode[],
		{ sshUser, pathToKey }: { pathToKey: string; sshUser: string }
	) => {
		try {
			const roleGroups: Record<"elasticsearch_master" | "elasticsearch_data", string[]> = {
				elasticsearch_data: [],
				elasticsearch_master: [],
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

			if (ENABLE_PASSWORD_AUTH_FOR_SSH) {
				inventoryParts.push(
					`[elasticsearch:vars]\nansible_ssh_user=${sshUser}\nansible_ssh_pass=admin\nansible_ssh_common_args='-o StrictHostKeyChecking=no'\n`
				);
			} else {
				inventoryParts.push(
					`[elasticsearch:vars]\nansible_ssh_user=${sshUser}\nansible_ssh_private_key_file=${pathToKey}\nansible_ssh_common_args='-o StrictHostKeyChecking=no'\n`
				);
			}

			const inventoryContent = inventoryParts.join("\n\n");

			await fs.promises.writeFile("ansible/ansible_inventory.ini", inventoryContent, "utf8");

			return inventoryContent;
		} catch (error) {
			console.error("Error creating Ansible inventory:", error);
			throw error;
		}
	};

	public createAnsibleInventoryForKibana = async (
		kibanaNodes: IKibanaNode[],
		{ pathToKey, sshUser }: { pathToKey: string; sshUser: string }
	) => {
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
				`[kibana:vars]\nansible_ssh_user=${sshUser}\nansible_ssh_private_key_file=${pathToKey}\nansible_ssh_common_args='-o StrictHostKeyChecking=no'`
			);
			const inventoryContent = inventoryParts.join("\n\n");

			await fs.promises.writeFile("ansible/ansible_inventory.ini", inventoryContent, "utf8");
			return inventoryContent;
		} catch (error) {
			console.error("Error creating Ansible inventory:", error);
			throw new Error(`Error creating Ansible inventory: ${(error as Error).message}`);
		}
	};

	public createInventoryForPrecheckPerNode = async ({
		pathToKey,
		node,
		iniName,
		sshUser,
	}: {
		node: { ip: string; name: string };
		pathToKey: string;
		sshUser: string;
		iniName: string;
	}) => {
		try {
			const roleGroups: Record<"elasticsearch", string[]> = {
				elasticsearch: [],
			};

			roleGroups.elasticsearch.push(`${node.name} ansible_host=${node.ip}`);

			const inventoryParts: string[] = [];

			Object.entries(roleGroups).forEach(([group, hosts]) => {
				if (hosts.length > 0) {
				}
				inventoryParts.push(`[${group}]\n${hosts.join("\n")}`);
			});

			if (ENABLE_PASSWORD_AUTH_FOR_SSH) {
				inventoryParts.push(
					`[elasticsearch:vars]\nansible_ssh_user=${sshUser}\nansible_ssh_pass=admin\nansible_ssh_common_args='-o StrictHostKeyChecking=no'\n`
				);
			} else {
				inventoryParts.push(
					`[elasticsearch:vars]\nansible_ssh_user=${sshUser}\nansible_ssh_private_key_file=${pathToKey}\nansible_ssh_common_args='-o StrictHostKeyChecking=no'\n`
				);
			}

			const inventoryContent = inventoryParts.join("\n\n");

			await fs.promises.writeFile(`ansible/ini/${iniName}`, inventoryContent, "utf8");

			return inventoryContent;
		} catch (error) {
			console.error("Error creating Ansible inventory:", error);
			throw error;
		}
	};
}

export const ansibleInventoryService = new AnsibleInventoryService();
