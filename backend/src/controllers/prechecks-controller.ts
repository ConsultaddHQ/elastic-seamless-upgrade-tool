import { Request, Response } from "express";
import { getAllElasticNodes, getElasticNodeById } from "../services/elastic-node.service.";
import { getLatestRunsByPrecheck, runPrecheck } from "../services/precheck-runs.service";
import { getPrecheckById } from "../config/precheck-config";
import { PrecheckStatus } from "../enums";
import { INodePrecheckRun } from "../models/node-precheck-runs.model";

export const runAllPrecheksHandler = async (req: Request, res: Response) => {
	const { clusterId } = req.params;
	const nodes = await getAllElasticNodes(clusterId);
	const runId = await runPrecheck(nodes, clusterId);
	res.send({ message: "Prechecks started", runId });
};

export const runPrechekByNodeIdHandler = async (req: Request, res: Response) => {
	const { clusterId, nodeId } = req.params;
	const node = await getElasticNodeById(nodeId);
	if (!node) {
		res.status(404).send({ message: "Node not found" });
		return;
	}

	const runId = await runPrecheck([node], clusterId);

	res.send({ message: "Prechecks started", runId });
};

export const getPrecheckRunByClusterIdHandler = async (req: Request, res: Response) => {
	const { clusterId } = req.params;
	const precheckRuns = await getLatestRunsByPrecheck(clusterId);
	if (!precheckRuns || precheckRuns.length === 0) {
		res.status(404).send({ message: "No precheck runs found" });
		return;
	}
	const groupedPrecheckRunsByNodeId = precheckRuns.reduce<Record<string, typeof precheckRuns>>((acc, run) => {
		const groupedBy = run.nodeId;
		if (!acc[groupedBy]) {
			acc[groupedBy] = [];
		}
		acc[groupedBy].push(run);
		return acc;
	}, {});
	const response = Object.entries(groupedPrecheckRunsByNodeId).map(([nodeId, precheckRuns]) => {
		const status = (() => {
			let hasCompleted = false;
			let hasPending = false;

			for (const run of precheckRuns) {
				if (run.status === PrecheckStatus.FAILED) return PrecheckStatus.FAILED;
				if (run.status === PrecheckStatus.RUNNING) return PrecheckStatus.RUNNING;
				if (run.status === PrecheckStatus.PENDING) hasPending = true;
				if (run.status === PrecheckStatus.COMPLETED) hasCompleted = true;
			}

			if (hasPending && hasCompleted) return PrecheckStatus.RUNNING;
			if (hasPending) return PrecheckStatus.PENDING;
			return PrecheckStatus.COMPLETED;
		})();
		const precheck = precheckRuns[0];

		const transformPrecheckRunForUI = (precheck: INodePrecheckRun) => {
			const { name } = getPrecheckById(precheck.precheckId) || {};
			const duration = precheck.endAt
				? parseFloat(((precheck.endAt.getTime() - precheck.startedAt.getTime()) / 1000).toFixed(2))
				: null;
			return {
				id: precheck.precheckId,
				name: name,
				status: precheck.status,
				logs: precheck.logs,
				startTime: precheck.startedAt,
				endTime: precheck.endAt,
				duration: duration,
			};
		};
		return {
			nodeId: nodeId,
			ip: precheck.ip,
			name: nodeId,
			status: status,
			prechecks: precheckRuns.map(transformPrecheckRunForUI),
		};
	});
	res.send(response);
};
