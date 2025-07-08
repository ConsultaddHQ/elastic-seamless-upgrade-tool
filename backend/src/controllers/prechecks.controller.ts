import { NextFunction, Request, Response } from "express";
import { getPrechecksGroupedByNode } from "../services/precheck-runs.service";
import { precheckReportService } from "../services/precheck-report.service";
import { NotFoundError } from "../errors";
import { clusterNodeService } from "../services/cluster-node.service";
import { precheckRunner } from "../prechecks/precheck-runner";
import { clusterUpgradeJobService } from "../services/cluster-upgrade-job.service";

export const runAllPrecheksHandler = async (req: Request, res: Response) => {
	const { clusterId } = req.params;
	const nodes = await clusterNodeService.getNodes(clusterId);
	const job = await clusterUpgradeJobService.getActiveClusterUpgradeJobByClusterId(clusterId);
	precheckRunner.runAll(job.jobId);
	res.send({ message: "Prechecks started" });
};

export const getPrecheckRunByClusterIdHandler = async (req: Request, res: Response, next: NextFunction) => {
	const { clusterId } = req.params;
	try {
		const response = await getPrechecksGroupedByNode(clusterId);
		res.send(response);
	} catch (err: any) {
		next(err);
	}
};

export const getPrecheckReportByClusterId = async (
	req: Request<{ clusterId: string }>,
	res: Response,
	next: NextFunction
) => {
	const { clusterId } = req.params;
	try {
		const content = await precheckReportService.generatePrecheckReportMdContent(clusterId);
		res.setHeader("Content-Disposition", `attachment; filename="precheck-report.md"`);
		res.setHeader("Content-Type", "text/markdown");
		res.send(content);
	} catch (err: any) {
		next(err);
	}
};
