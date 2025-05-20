import { loadYaml } from "./yaml-utils";

const breakingChangesMap: Record<string, string | undefined> =
	loadYaml<Record<string, string | undefined>>("breaking-changes.yaml") || {};

export const getBreakingChanges = async (currentVersion: string, targetVersion: string) => {
	const sortedVersions = Object.keys(breakingChangesMap).sort((a, b) => {
		const pa = a.split(".").map(Number);
		const pb = b.split(".").map(Number);
		for (let i = 0; i < 3; i++) {
			if (pa[i] !== pb[i]) return pa[i] - pb[i];
		}
		return 0;
	});
	const parseVersion = (v: string) => v.split(".").map(Number);
	const isGreater = (a: string, b: string) => {
		const pa = parseVersion(a);
		const pb = parseVersion(b);
		for (let i = 0; i < 3; i++) {
			if (pa[i] > pb[i]) return true;
			if (pa[i] < pb[i]) return false;
		}
		return false;
	};
	const isLessOrEqual = (a: string, b: string) => {
		const pa = parseVersion(a);
		const pb = parseVersion(b);
		for (let i = 0; i < 3; i++) {
			if (pa[i] < pb[i]) return true;
			if (pa[i] > pb[i]) return false;
		}
		return true;
	};
	const changes: string[] = [];
	sortedVersions.forEach((version) => {
		if (isGreater(version, currentVersion) && isLessOrEqual(version, targetVersion)) {
			const change = breakingChangesMap[version];
			change && changes.push(change);
		}
	});
	return changes.join("\n");
};

function extractBreakingChangesMap(md: string): Record<string, string> {
	const versionRegex = /^## (\d+\.\d+\.\d+)\s.*$/gm;
	const matches: { version: string; index: number }[] = [];

	let match;
	while ((match = versionRegex.exec(md)) !== null) {
		matches.push({ version: match[1], index: match.index });
	}
	const versionMap: Record<string, string> = {};

	for (let i = 0; i < matches.length; i++) {
		const { version, index } = matches[i];
		const nextIndex = i + 1 < matches.length ? matches[i + 1].index : md.length;
		const section = md.slice(index + 1, nextIndex).trim();
		versionMap[version] = section;
	}

	return versionMap;
}
