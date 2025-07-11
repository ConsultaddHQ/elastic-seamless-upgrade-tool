import { NextFunction, Request, Response } from "express";
import { precheckReportService } from "../services/precheck-report.service";
import { precheckRunner } from "../prechecks/precheck-runner";
import { clusterUpgradeJobService } from "../services/cluster-upgrade-job.service";
import { precheckService } from "../services/precheck.service";

export const runAllPrecheksHandler = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { clusterId } = req.params;
		const job = await clusterUpgradeJobService.getActiveClusterUpgradeJobByClusterId(clusterId);
		precheckRunner.runAll(job);
		res.send({ message: "Prechecks started" });
	} catch (err) {
		next(err);
	}
};

export const getPrecheckRunByClusterIdHandler = async (req: Request, res: Response, next: NextFunction) => {
	const { clusterId } = req.params;
	try {
		const response = await precheckService.getGroupedPrecheckByClusterId(clusterId);
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
