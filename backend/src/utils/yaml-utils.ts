import fs from "fs-extra";
import yaml from "yaml";

export const loadYaml = async (file: string): Promise<any> => {
	try {
		const content = fs.readFileSync(file, "utf8");
		return await yaml.parse(content);
	} catch (error) {
		console.error("Error reading YAML file:", error);
		throw error;
	}
};

export const saveYaml = async (file: string, data: any): Promise<void> => {
	try {
		const yamlStr = yaml.stringify(data);
		fs.writeFileSync(file, yamlStr, "utf8");
		console.log("YAML file updated successfully!");
	} catch (error) {
		console.error("Error writing YAML file:", error);
	}
};
