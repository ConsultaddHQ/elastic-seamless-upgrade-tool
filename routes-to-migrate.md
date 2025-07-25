# REST Endpoints in backend/ Express App

## Core Application Routes (from index.ts)

- `GET /health` ❌

## Elastic Cluster Routes (base: /api/elastic/clusters)

- `POST /api/elastic/clusters/:clusterId/upgrade-job` ✅ (endpoint is bit diff)
- `GET /api/elastic/clusters/:clusterId/health` ❌
- `GET /api/elastic/clusters/:clusterId/nodes`  ✅
- `GET /api/elastic/clusters/:clusterId/kibana-nodes` ✅ (merged with nodes endpoint)
- `GET /api/elastic/clusters/:clusterId/deprecations/elastic-search` ❌ (not needed as of now)
- `GET /api/elastic/clusters/:clusterId/valid-snapshots` ❌ (not needed as of now)
- `POST /api/elastic/clusters` ✅
- `GET /api/elastic/clusters/nodes/:nodeId` ❌ (not needed as of now)
- `POST /api/elastic/clusters/certificates/upload` ✅ (work diff now)
- `GET /api/elastic/clusters/:clusterId/deprecations/kibana` ❌ (not needed as of now)
- `POST /api/elastic/clusters/:clusterId/prechecks`  ✅
- `GET /api/elastic/clusters/:clusterId/prechecks`  ✅
- `GET /api/elastic/clusters/verify` ❌
- `GET /api/elastic/clusters/:clusterId/info`
  - This also adds the cluster in monitoring service for pulling data on backend
- `GET /api/elastic/clusters/:clusterId/upgrade_info`
- `GET /api/elastic/clusters/:clusterId/prechecks/report` 
- `POST /api/elastic/clusters/:clusterId/nodes/upgrade` 
- `POST /api/elastic/clusters/:clusterId/upgrade-all`
- `POST /api/elastic/clusters/:clusterId/nodes/upgrade-kibana`

## Settings Routes (base: /api/settings)

- `POST /api/settings` ✅
- `GET /api/settings` ✅

## Webhook Routes (base: /webhook)

- `POST /webhook/clusters/:clusterId/update-status` ❌ (Not needed any more)
