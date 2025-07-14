import { ElasticClient } from "../clients/elastic.client";
import { KibanaClient } from "../clients/kibana.client";
import { PrecheckStatus } from "../enums";
import logger from "../logger/logger";
import { getBreakingChanges } from "../utils/breaking-changes-utils";
import { clusterUpgradeJobService } from "./cluster-upgrade-job.service";
import { precheckService } from "./precheck.service";

class PrecheckReportService {
	async generatePrecheckReportMdContent(clusterId: string): Promise<string> {
		const elasticClient = await ElasticClient.buildClient(clusterId);
		const {
			version: { number: currentVersion },
		} = await elasticClient.getClient().info();
		const { targetVersion } = await clusterUpgradeJobService.getActiveClusterUpgradeJobByClusterId(clusterId);
		const groupedPrechecks = await precheckService.getGroupedPrecheckByClusterId(clusterId);
		const prechecksGroupedByNode = groupedPrechecks.node;
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

		md = md + "\n\n";

		md += `## ✅ Index Summary\n`;
		md += `| Index Name | Status |\n`;
		md += `|-----------|--------|\n`;
		groupedPrechecks.index.forEach((precheck) => {
			md += `| ${precheck.name} | ${precheck.status} |\n`;
		});

		md += `\n## 🔍 Detailed Pre-checks\n`;

		groupedPrechecks.index.forEach((index) => {
			md += `\n### 🖥️ ${index.name}\n`;

			md += `| Check | Status | Duration (s) |\n`;
			md += `|-------|--------|---------------|\n`;

			index.prechecks.forEach((check) => {
				md += `| ${check.name} | ${check.status} | ${check.duration} |\n`;
			});

			md += `\n<details><summary>Show Logs</summary>\n\n`;
			index.prechecks.forEach((check) => {
				md += `#### ${check.name}\n`;
				const logs = check.logs.length > 0 ? check.logs : ["N/A"];
				md += "```\n" + logs.join("\n") + "\n```\n";
			});
			md += `</details>\n`;
		});

		const eSDeprecationsMdReport = await this.getESDeprecationsMdReport(clusterId);
		md = md + "\n\n" + eSDeprecationsMdReport;

		const kibanaDeprecationsMdReport = await this.getKibanaDeprecationsMdReport(clusterId);
		md = md + "\n\n" + kibanaDeprecationsMdReport;

		if (targetVersion) {
			const breakingChanges = await getBreakingChanges(currentVersion, targetVersion);
			md = md + breakingChanges;
		}

		return md;
	}

	private async getESDeprecationsMdReport(clusterId: string): Promise<string> {
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
	}

	private async getKibanaDeprecationsMdReport(clusterId: string): Promise<string> {
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
	}
}

export const precheckReportService = new PrecheckReportService();
