import fs from "fs-extra";
import yaml from "yaml";

export const loadYaml = <T>(file: string): T => {
	try {
		const content = fs.readFileSync(file, "utf8");
		return yaml.parse(content);
	} catch (error) {
		console.error("Error reading YAML file:", error);
		throw error;
	}
};

export const saveYaml = (file: string, data: any) => {
	try {
		const yamlStr = yaml.stringify(data);
		fs.writeFileSync(file, yamlStr, "utf8");
		console.log("YAML file updated successfully!");
	} catch (error) {
		console.error("Error writing YAML file:", error);
	}
};
