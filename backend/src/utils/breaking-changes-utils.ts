import { string } from "yaml/dist/schema/common/string";
import { loadYaml } from "./yaml-utils";
import semver from "semver";

export interface Change {
	[key: string]: any;
}

export interface ChangeGroup {
	category: string;
	changes: Change[];
}

export interface VersionEntry {
	version: string;
	url: string;
	breaking_changes?: ChangeGroup[];
	deprecations?: ChangeGroup[];
}

export interface FlattenedChange extends Change {
	version: string;
	url: string;
	category: string;
}

export function convertBreakingChangesToMarkdown(changes: FlattenedChange[]): string {
	const grouped = new Map<string, Map<string, FlattenedChange[]>>();

	// Group by version → category
	for (const change of changes) {
		if (!grouped.has(change.version)) {
			grouped.set(change.version, new Map());
		}
		const versionGroup = grouped.get(change.version)!;

		if (!versionGroup.has(change.category)) {
			versionGroup.set(change.category, []);
		}
		versionGroup.get(change.category)!.push(change);
	}

	// Sort versions using semver
	const sortedVersions = Array.from(grouped.keys()).sort((a, b) =>
		semver.compare(semver.coerce(a)!.version, semver.coerce(b)!.version)
	);

	let markdown = "## Breaking Changes\n\n";

	for (const version of sortedVersions) {
		const categories = grouped.get(version)!;
		markdown += `### Version ${version}\n\n`;

		for (const [category, items] of categories) {
			markdown += `#### ${category}\n\n`;

			for (const item of items) {
				const title =
					item.setting || item.issue || item.name || item.change || item.feature || "Unnamed Change";

				const description = item.description || item.details || "";
				const impact = item.impact ? `\n> **Impact**: ${item.impact}` : "";

				markdown += `- **${title}**: ${description.trim()}${impact}\n\n`;
			}
		}
	}

	return markdown.trim();
}

/**
 * Extract breaking changes from versions strictly between current and target.
 * @param data Parsed YAML data
 * @param currentVersion Version in x.y.z format (e.g., 8.2.0)
 * @param targetVersion Version in x.y.z format (e.g., 8.6.0)
 * @returns Flattened array of breaking changes with metadata
 */
export function getBreakingChangesBetweenVersions(
	data: VersionEntry[],
	currentVersion: string,
	targetVersion: string
): FlattenedChange[] {
	return data
		.filter((entry) => {
			const entryVersion = semver.coerce(entry.version);
			return (
				entryVersion &&
				semver.gt(entryVersion.version, currentVersion) &&
				semver.lte(entryVersion.version, targetVersion)
			);
		})
		.flatMap((entry) => {
			return (entry.breaking_changes || []).flatMap((changeGroup) =>
				changeGroup.changes.map((change) => ({
					version: entry.version,
					url: entry.url,
					category: changeGroup.category,
					...change,
				}))
			);
		});
}

export const getBreakingChanges = async (current: string, target: string) => {
	const parsedData = loadYaml("breaking-changes.yaml");
	if (Array.isArray(parsedData)) {
		const changes = getBreakingChangesBetweenVersions(parsedData, current, target);
		return convertBreakingChangesToMarkdown(changes);
	} else {
		console.error("YAML root is not an array");
		return "";
	}
};
