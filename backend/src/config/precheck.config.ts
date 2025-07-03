import { loadYaml } from "../utils/yaml-utils";

export interface PrecheckConfig {
	id: string;
	name: string;
	playbookPath: string;
}
export const PRECHECK_CONFIG: PrecheckConfig[] = loadYaml("prechecks.yaml");

export const getPrecheckById = (precheckId: string): PrecheckConfig | undefined => {
	return PRECHECK_CONFIG.find((precheck) => precheck.id === precheckId);
};
