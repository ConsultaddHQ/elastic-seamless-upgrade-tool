import { Router } from 'express';
import {
  addOrUpdateClusterDetail,
  getClusterDetails,
  getElasticDeprecationInfo,
  getNodesInfo,
  healthCheck,
  getLogsStream,
  getKibanaDeprecationsInfo,
  getValidSnapshots,
  uploadCertificates,
  getUpgradeDetails,
  handleUpgrades,
  getNodeInfo,
  addOrUpdateTargetVersion,
  verfiySshKey,
  verfiyCluster,
  handleUpgradeAll,
} from '../controllers/elastic-controller';

const router = Router();

import multer from 'multer';

const upload = multer({ dest: 'uploads/' });

router.post('/:clusterId/add-version',addOrUpdateTargetVersion);

router.get('/:clusterId/health', healthCheck);

router.get('/:clusterId/nodes', getNodesInfo);

router.get(
  '/:clusterId/deprecations/elastic-search',
  getElasticDeprecationInfo,
);

router.get('/:clusterId/valid-snapshots', getValidSnapshots);

router.post('', addOrUpdateClusterDetail);

router.get('/nodes/:nodeId', getNodeInfo);

router.post('/:clusterId/nodes/upgrade', handleUpgrades);

router.get('/:clusterId/info', getClusterDetails);

router.get('/:clusterId/nodes/:nodeId/logs/stream', getLogsStream);

router.post('/certificates/upload', upload.array('files'), uploadCertificates);

router.get('/:clusterId/upgrade_info', getUpgradeDetails);

router.get('/:clusterId/deprecations/kibana', getKibanaDeprecationsInfo);

router.post('/:clusterId/verify-ssh',verfiySshKey);

router.get('/verify',verfiyCluster)

router.post('/:clusterId/upgrade-all',handleUpgradeAll)

export default router;
