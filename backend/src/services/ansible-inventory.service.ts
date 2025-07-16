import fs from "fs";
import { ClusterNodeType, IClusterNode } from "../models/cluster-node.model";
import logger from "../logger/logger";
import { randomUUID } from "crypto";
const ANSIBLE_PLAYBOOKS_PATH = process.env.ANSIBLE_PLAYBOOKS_PATH;

class AnsibleInventoryService {
	constructor() {}

	public createInventory = async ({
		nodes,
		pathToKey,
		sshUser,
	}: {
		pathToKey: string;
		sshUser: string;
		nodes: IClusterNode[];
	}): Promise<string> => {
		try {
			const roleGroups: Record<"elasticsearch_master" | "elasticsearch_data" | "kibana", string[]> = {
				elasticsearch_master: [],
				elasticsearch_data: [],
				kibana: [],
			};

			const iniName = `${nodes[0].clusterId}-${randomUUID()}.ini`;
			const iniPath = `${ANSIBLE_PLAYBOOKS_PATH}/ini/${iniName}`;

			for (const node of nodes) {
				const hostEntry = `${node.name} ansible_host=${node.ip}`;

				if (node.type === ClusterNodeType.ELASTIC) {
					if (node.isMaster) {
						roleGroups.elasticsearch_master.push(hostEntry);
					} else if (node.roles.includes("data")) {
						roleGroups.elasticsearch_data.push(hostEntry);
					}
				} else {
					roleGroups.kibana.push(hostEntry);
				}
			}

			const inventorySections = Object.entries(roleGroups)
				.filter(([, hosts]) => hosts.length > 0)
				.map(([group, hosts]) => `[${group}]\n${hosts.join("\n")}`);

			inventorySections.push(
				`[all:vars]`,
				`ansible_ssh_user=${sshUser}`,
				`ansible_ssh_private_key_file=${pathToKey}`,
				`ansible_ssh_common_args='-o StrictHostKeyChecking=no'`
			);

			const inventoryContent = inventorySections.join("\n");
			await fs.promises.writeFile(iniPath, inventoryContent, "utf8");

			return iniPath;
		} catch (error) {
			logger.error("Error creating Ansible inventory:", error);
			throw new Error(`Error creating Ansible inventory: ${(error as Error).message}`);
		}
	};

	public createInventoryForNode = async (props: { node: IClusterNode; pathToKey: string; sshUser: string }) => {
		return await this.createInventory({
			...props,
			nodes: [props.node],
		});
	};
}

export const ansibleInventoryService = new AnsibleInventoryService();
