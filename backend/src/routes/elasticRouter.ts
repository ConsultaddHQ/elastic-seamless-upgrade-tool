import { Router } from "express";
import { getClusterDetails, getDepriciationInfo, getNodesInfo, healthCheck } from "../controllers/elasticController";

const router = Router();

/**
 * @swagger
 * /api/elastic/health:
 *   get:
 *     summary: returns health of the elasticsearch cluster
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Hello, World!
 */
router.post('/health',healthCheck)


/**
 * @swagger
 * /api/elastic/nodes:
 *   post:
 *     summary: Get Elastic node details
 *     description: Retrieve details of all nodes in the Elastic cluster, including their IDs, IPs, roles, and operating system information.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *                 description: The URL of the Elastic cluster.
 *                 example: https://localhost:9200
 *               username:
 *                 type: string
 *                 description: Username for Elastic authentication.
 *                 example: elastic
 *               password:
 *                 type: string
 *                 description: Password for Elastic authentication.
 *                 example: upgrade
 *     responses:
 *       200:
 *         description: Successfully retrieved Elastic node details.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: Unique identifier of the node.
 *                     example: vy7Smq2URr-0QX3TQkH_gA
 *                   ip:
 *                     type: string
 *                     description: IP address of the node.
 *                     example: 172.21.0.3
 *                   name:
 *                     type: string
 *                     description: Name of the node.
 *                     example: es01
 *                   version:
 *                     type: string
 *                     description: Elastic version running on the node.
 *                     example: 8.7.1
 *                   roles:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: List of roles assigned to the node.
 *                     example: ["data", "master", "ml", "transform"]
 *                   os:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         description: Name of the operating system.
 *                         example: Linux
 *                       version:
 *                         type: string
 *                         description: Version of the operating system.
 *                         example: 6.10.14-linuxkit
 *       400:
 *         description: Bad Request. Invalid input data.
 *       401:
 *         description: Unauthorized. Invalid authentication credentials.
 *       500:
 *         description: Internal Server Error. Could not connect to the Elastic cluster or fetch nodes.
 */
router.post('/nodes',getNodesInfo);


/**
 * @swagger
 * /api/elastic/depriciation:
 *   post:
 *     summary: Retrieve Elastic deprecation settings
 *     description: Fetch details of deprecated settings and configurations in the Elastic cluster.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *                 description: The URL of the Elastic cluster.
 *                 example: https://localhost:9200
 *               username:
 *                 type: string
 *                 description: Username for Elastic authentication.
 *                 example: elastic
 *               password:
 *                 type: string
 *                 description: Password for Elastic authentication.
 *                 example: upgrade
 *     responses:
 *       200:
 *         description: Successfully retrieved Elastic deprecation warnings.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 cluster_settings:
 *                   type: array
 *                   description: Deprecation warnings related to cluster settings.
 *                   items:
 *                     type: string
 *                   example: []
 *                 node_settings:
 *                   type: array
 *                   description: Deprecation warnings related to node settings.
 *                   items:
 *                     type: object
 *                     properties:
 *                       level:
 *                         type: string
 *                         description: Severity level of the deprecation warning.
 *                         example: warning
 *                       message:
 *                         type: string
 *                         description: Description of the deprecated setting.
 *                         example: setting [xpack.monitoring.collection.enabled] is deprecated and will be removed after 8.0
 *                       url:
 *                         type: string
 *                         description: URL for more information about the deprecation.
 *                         example: https://ela.st/es-deprecation-7-monitoring-settings
 *                       details:
 *                         type: string
 *                         description: Detailed information about the deprecated setting.
 *                         example: the setting {xpack.monitoring.collection.enabled} is currently set to {true}
 *                       resolve_during_rolling_upgrade:
 *                         type: boolean
 *                         description: Indicates whether this deprecation can be resolved during a rolling upgrade.
 *                         example: false
 *                 index_settings:
 *                   type: object
 *                   description: Deprecation warnings related to index settings.
 *                   example: {}
 *                 ml_settings:
 *                   type: array
 *                   description: Deprecation warnings related to machine learning settings.
 *                   items:
 *                     type: string
 *                   example: []
 *       400:
 *         description: Bad Request. Invalid input data.
 *       401:
 *         description: Unauthorized. Invalid authentication credentials.
 *       500:
 *         description: Internal Server Error. Could not connect to the Elastic cluster or fetch deprecation warnings.
 */


// For /api/elastic/cluster endpoint
router.post('/depriciation',getDepriciationInfo)
    


/**
 * @swagger
 * /api/elastic/cluster:
 *   post:
 *     summary: Get Elastic cluster details
 *     description: Retrieve details of an Elastic cluster by providing the connection details in the request body.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *                 description: The URL of the Elastic cluster.
 *                 example: https://localhost:9200
 *               username:
 *                 type: string
 *                 description: Username for Elastic authentication.
 *                 example: elastic
 *               password:
 *                 type: string
 *                 description: Password for Elastic authentication.
 *                 example: upgrade
 *     responses:
 *       200:
 *         description: Successfully retrieved Elastic cluster details.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 clusterName:
 *                   type: string
 *                   description: Name of the cluster.
 *                   example: ORACLE
 *                 clusterUUID:
 *                   type: string
 *                   description: Unique identifier for the cluster.
 *                   example: lz7A7ZNuSFSRiYKGmdIvhg
 *                 status:
 *                   type: string
 *                   description: Status of the cluster.
 *                   example: yellow
 *                 version:
 *                   type: string
 *                   description: Version of Elastic.
 *                   example: 8.7.1
 *                 timedOut:
 *                   type: boolean
 *                   description: Indicates if the request timed out.
 *                   example: false
 *                 numberOfDataNodes:
 *                   type: integer
 *                   description: Number of data nodes in the cluster.
 *                   example: 3
 *                 numberOfNodes:
 *                   type: integer
 *                   description: Total number of nodes in the cluster.
 *                   example: 3
 *                 activePrimaryShards:
 *                   type: integer
 *                   description: Number of active primary shards.
 *                   example: 32
 *                 activeShards:
 *                   type: integer
 *                   description: Total number of active shards.
 *                   example: 14
 *                 unassignedShards:
 *                   type: integer
 *                   description: Number of unassigned shards.
 *                   example: 14
 *                 initializingShards:
 *                   type: integer
 *                   description: Number of shards currently initializing.
 *                   example: 0
 *                 relocatingShards:
 *                   type: integer
 *                   description: Number of shards being relocated.
 *                   example: 0
 *       400:
 *         description: Bad Request. Invalid input data.
 *       401:
 *         description: Unauthorized. Invalid authentication credentials.
 *       500:
 *         description: Internal Server Error. Could not connect to the Elastic cluster.
 */
router.post('/cluster',getClusterDetails)



export default router;