import { index, layout, route, type RouteConfig } from "@react-router/dev/routes"

export default [
	layout("layouts/data.tsx", [route("add-cluster", "routes/setup.tsx"), route("/login", "routes/login.tsx")]),
	layout("layouts/common.tsx", [
		index("routes/clusterListing.tsx"),
		route(":clusterId/migrate-indices", "routes/migrate.manage.indices.tsx"),
		route("plugins", "routes/pluginListing.tsx"),
		route(":clusterId/nodes", "routes/clusterNodes.tsx"),
		layout("layouts/config.tsx", [
			route(":clusterId/cluster-overview", "routes/clusterOverview.tsx"),
			route(":clusterId/upgrade-assistant", "routes/upgradeAssist.tsx"),
		]),
		layout("safeRoutes/deprecation.tsx", [
			route(":clusterId/elastic/deprecation-logs", "routes/elasticDeprecationLogs.tsx"),
			route(":clusterId/kibana/deprecation-logs", "routes/kibanaDeprecationLogs.tsx"),
		]),
		layout("safeRoutes/precheck.tsx", [route(":clusterId/prechecks", "routes/preCheck.tsx")]),
		layout("safeRoutes/elasticUpgrade.tsx", [route(":clusterId/elastic/upgrade", "routes/clusterUpgrade.tsx")]),
		layout("safeRoutes/kibanaUpgrade.tsx", [route(":clusterId/kibana/upgrade", "routes/kibanaUpgrade.tsx")]),
	]),
	route("*", "routes/status/page404.tsx"),
] satisfies RouteConfig
