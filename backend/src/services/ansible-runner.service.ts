import { spawn } from "child_process";
import logger from "../logger/logger";
const ANSIBLE_PLAYBOOKS_PATH = process.env.ANSIBLE_PLAYBOOKS_PATH;

if (ANSIBLE_PLAYBOOKS_PATH === undefined || ANSIBLE_PLAYBOOKS_PATH === "") {
	throw new Error("ANSIBLE_PLAYBOOKS_PATH is not defined");
} else {
	logger.info(`ANSIBLE_PLAYBOOKS_PATH: ${ANSIBLE_PLAYBOOKS_PATH}`);
}

interface PlaybookVariables {
	[key: string]: any;
	playbook_run_id: string;
	playbook_run_type: string;
	cluster_type: string;
	es_password?: string;
	es_username?: string;
}

class AnsibleRunnerService {
	constructor() {}

	async runPlaybook({
		playbookPath,
		inventoryPath,
		variables,
	}: {
		playbookPath: string;
		inventoryPath: string;
		variables: PlaybookVariables;
	}) {
		const runId = variables.playbook_run_id;
		const extraVars = [
			...Object.entries(variables).filter(([, value]) => !(value == undefined || value == null)),
			...Object.entries({ runId: runId }),
		]
			.map(([key, value]) => `${key}=${value}`)
			.join(" ");

		const args = ["-i", inventoryPath, playbookPath, "-e", extraVars];
		logger.info(
			`[runId: ${runId}] [playbook: ${playbookPath}] [cwd:${ANSIBLE_PLAYBOOKS_PATH}]  Running playbook with args: ${args.join(" ")}`
		);
		return new Promise((resolve, reject) => {
			const process = spawn("ansible-playbook", args, {
				cwd: ANSIBLE_PLAYBOOKS_PATH,
			});

			process.stdout.on("data", (data) => {
				logger.info(`[runId: ${runId}] [playbook: ${playbookPath}] [stdout]: ${data}`);
			});

			process.stderr.on("data", (data) => {
				logger.error(`[runId: ${runId}] [playbook: ${playbookPath}] [stderr]: ${data}`);
			});

			process.on("close", (code) => {
				logger.info(`[runId: ${runId}] [playbook: ${playbookPath}] Process exited with code: ${code}`);
				if (code === 0) {
					resolve(code);
				} else {
					reject(new Error(`Process exited with non-zero code: ${code}`));
				}
			});

			process.on("error", (err) => {
				logger.error(`[runId: ${runId}] [playbook: ${playbookPath}] Failed to start playbook: ${err.message}`);
				reject(err);
			});
		});
	}
}

export const ansibleRunnerService = new AnsibleRunnerService();
