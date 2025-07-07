import { Router } from "express";
import {
	addOrUpdateClusterDetail,
	getClusterDetails,
	getNodesInfo,
	healthCheck,
	uploadCertificates,
	getNodeInfo,
	verifySshKey,
	verfiyCluster,
	getKibanaNodesInfo,
} from "../controllers/elastic.controller";
import {
	getElasticDeprecationInfo,
	getKibanaDeprecationsInfo,
	getValidSnapshots,
	getUpgradeDetails,
	handleUpgrades,
	createClusterUpgradeJob,
	handleKibanaUpgrades,
	handleUpgradeAll,
} from "../controllers/cluster-upgrade.controller";
import {
	runAllPrecheksHandler,
	runPrechekByNodeIdHandler,
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

router.post("/:clusterId/verify-ssh", verifySshKey);

router.post("/:clusterId/prechecks", runAllPrecheksHandler);

router.get("/:clusterId/prechecks", getPrecheckRunByClusterIdHandler);

router.get("/:clusterId/prechecks/report", getPrecheckReportByClusterId);

router.post("/:clusterId/prechecks/nodes/:nodeId", runPrechekByNodeIdHandler);

router.get("/verify", verfiyCluster);

export default router;
