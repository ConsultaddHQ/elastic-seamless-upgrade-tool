import { ElasticClient } from "../clients/elastic.client";
import { KibanaClient } from "../clients/kibana.client";
import logger from "../logger/logger";
import { getPrechecksGroupedByNode } from "./precheck-runs.service";
import { getClusterInfoById } from "./cluster-info.service";
import { getBreakingChanges } from "../utils/breaking-changes-utils";

const getESDeprecationsMdReport = async (clusterId: string): Promise<string> => {
	const elasticClient = await ElasticClient.buildClient(clusterId);
	let md = "";
	const data: any = await elasticClient.getClient().transport.request({
		method: "GET",
		path: "/_migration/deprecations",
	});
	for (const [type, issues] of Object.entries(data)) {
		if (Array.isArray(issues) && issues.length) {
			md += `### ${type}\n`;
			issues.forEach((issue: any) => {
				md += `- **${issue.message}**\n`;
				if (issue.details) md += `  - Details: ${issue.details}\n`;
				if (issue.level) md += `  - Level: \`${issue.level}\`\n`;
			});
			md += "\n";
		}
	}
	if (md) {
		return `## ⚠️ Elasticsearch Deprecations\n\n\n${md}`;
	}
	return `## ⚠️ Elasticsearch Deprecations\n\nN/A${md}`;
};

const getKibanaDeprecationsMdReport = async (clusterId: string): Promise<string> => {
	const kibanClient = await KibanaClient.buildClient(clusterId);
	let md = "";
	const data = await kibanClient.getDeprecations();
	logger.info(JSON.stringify(data, null, 2));
	if (Array.isArray(data)) {
		data.forEach((item) => {
			md += `- **${item.title}**\n`;
			if (item.message) md += `  - ${item.message}\n`;
			if (item.level) md += `  - Level: \`${item.level}\`\n`;
			if (item.correctiveActions?.manualSteps?.length) {
				md += `  - Manual Steps:\n`;
				item.correctiveActions.manualSteps.forEach((step: string) => {
					md += `    - ${step}\n`;
				});
			}
			md += "\n";
		});
	}
	if (md) {
		return `## ⚠️ Kibana Deprecations\n\n${md}`;
	}
	return `## ⚠️ Kibana Deprecations\n\nN/A`;
};

export const generatePrecheckReportMdContent = async (clusterId: string): Promise<string> => {
	const elasticClient = await ElasticClient.buildClient(clusterId);
	const {
		version: { number: currentVersion },
	} = await elasticClient.getClient().info();
	const { targetVersion } = await getClusterInfoById(clusterId);
	const prechecksGroupedByNode = await getPrechecksGroupedByNode(clusterId);
	let md = `# 📋 Elasticsearch Pre-check Report\n\n`;
	md += `Generated on: ${new Date().toISOString()}\n\n`;

	md += `## ✅ Node Summary\n`;
	md += `| Node Name | IP | Status |\n`;
	md += `|-----------|----|--------|\n`;
	prechecksGroupedByNode.forEach((node) => {
		md += `| ${node.name} | ${node.ip} | ${node.status} |\n`;
	});

	md += `\n## 🔍 Detailed Pre-checks\n`;

	prechecksGroupedByNode.forEach((node) => {
		md += `\n### 🖥️ ${node.name} (${node.ip})\n`;

		md += `| Check | Status | Duration (s) |\n`;
		md += `|-------|--------|---------------|\n`;

		node.prechecks.forEach((check) => {
			md += `| ${check.name} | ${check.status} | ${check.duration} |\n`;
		});

		md += `\n<details><summary>Show Logs</summary>\n\n`;
		node.prechecks.forEach((check) => {
			md += `#### ${check.name}\n`;
			const logs = check.logs.length > 0 ? check.logs : ["N/A"];
			md += "```\n" + logs.join("\n") + "\n```\n";
		});
		md += `</details>\n`;
	});

	const eSDeprecationsMdReport = await getESDeprecationsMdReport(clusterId);
	md = md + "\n\n" + eSDeprecationsMdReport;

	const kibanaDeprecationsMdReport = await getKibanaDeprecationsMdReport(clusterId);
	md = md + "\n\n" + kibanaDeprecationsMdReport;

	if (targetVersion) {
		md = md + "\n\n## Breaking Changes\n\n";
		const breakingChanges = await getBreakingChanges(currentVersion, targetVersion);
		md = md + breakingChanges;
	}

	return md;
};
