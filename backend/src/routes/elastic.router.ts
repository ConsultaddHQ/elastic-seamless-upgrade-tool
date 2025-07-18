import { Router } from "express";
import {
	addOrUpdateClusterDetail,
	getClusterDetails,
	getElasticDeprecationInfo,
	getNodesInfo,
	healthCheck,
	getKibanaDeprecationsInfo,
	getValidSnapshots,
	uploadCertificates,
	getUpgradeDetails,
	handleUpgrades,
	getNodeInfo,
	createClusterUpgradeJob,
	verfiyCluster,
	getKibanaNodesInfo,
	handleKibanaUpgrades,
	handleUpgradeAll,
} from "../controllers/elastic.controller";
import {
	runAllPrecheksHandler,
	getPrecheckRunByClusterIdHandler,
	getPrecheckReportByClusterId,
} from "../controllers/prechecks.controller";

const router = Router();

import multer from "multer";

const upload = multer({ dest: "uploads/" });

router.post("/:clusterId/upgrade-job", createClusterUpgradeJob);

router.get("/:clusterId/health", healthCheck);

router.get("/:clusterId/nodes", getNodesInfo);

router.get("/:clusterId/kibana-nodes", getKibanaNodesInfo);

router.get("/:clusterId/deprecations/elastic-search", getElasticDeprecationInfo);

router.get("/:clusterId/valid-snapshots", getValidSnapshots);

router.post("", addOrUpdateClusterDetail);

router.get("/nodes/:nodeId", getNodeInfo);

router.post("/:clusterId/nodes/upgrade", handleUpgrades);

router.post("/:clusterId/upgrade-all", handleUpgradeAll);

router.post("/:clusterId/nodes/upgrade-kibana", handleKibanaUpgrades);

router.get("/:clusterId/info", getClusterDetails);

router.post("/certificates/upload", upload.array("files"), uploadCertificates);

router.get("/:clusterId/upgrade_info", getUpgradeDetails);

router.get("/:clusterId/deprecations/kibana", getKibanaDeprecationsInfo);

router.post("/:clusterId/prechecks", runAllPrecheksHandler);

router.get("/:clusterId/prechecks", getPrecheckRunByClusterIdHandler);

router.get("/:clusterId/prechecks/report", getPrecheckReportByClusterId);

router.get("/verify", verfiyCluster);

export default router;
