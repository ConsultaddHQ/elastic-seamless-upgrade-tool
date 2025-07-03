import { NextFunction, Request, Response } from "express";
import { getAllElasticNodes, getElasticNodeById } from "../services/elastic-node.service.";
import { getPrechecksGroupedByNode, runPrecheck } from "../services/precheck-runs.service";
import { generatePrecheckReportMdContent } from "../services/precheck-report.service";
import { NotFoundError } from "../errors";

export const runAllPrecheksHandler = async (req: Request, res: Response) => {
	const { clusterId } = req.params;
	const nodes = await getAllElasticNodes(clusterId);
	const runId = await runPrecheck(nodes, clusterId);
	res.send({ message: "Prechecks started", runId });
};

export const runPrechekByNodeIdHandler = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { clusterId, nodeId } = req.params;
		const node = await getElasticNodeById(nodeId);
		if (!node) {
			throw new NotFoundError("Node not found");
		}
		const runId = await runPrecheck([node], clusterId);
		res.send({ message: "Prechecks started", runId });
	} catch (err: any) {
		next(err);
	}
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
		const content = await generatePrecheckReportMdContent(clusterId);
		res.setHeader("Content-Disposition", `attachment; filename="precheck-report.md"`);
		res.setHeader("Content-Type", "text/markdown");
		res.send(content);
	} catch (err: any) {
		next(err);
	}
};
