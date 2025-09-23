import { index, layout, route, type RouteConfig } from "@react-router/dev/routes"

export default [
	layout("layouts/data.tsx", [route("add-cluster", "routes/setup.tsx")]),
	layout("layouts/common.tsx", [
		index("routes/clusterListing.tsx"),
		route("plugins", "routes/pluginListing.tsx"),
		layout("safeRoutes/clusterNotAdded.tsx", [
			layout("layouts/config.tsx", [
				route("cluster-overview", "routes/clusterOverview.tsx"),
				route("upgrade-assistant", "routes/upgradeAssist.tsx"),
			]),
			layout("safeRoutes/deprecation.tsx", [
				route("elastic/deprecation-logs", "routes/elasticDeprecationLogs.tsx"),
				route("kibana/deprecation-logs", "routes/kibanaDeprecationLogs.tsx"),
			]),
			layout("safeRoutes/precheck.tsx", [route("prechecks", "routes/preCheck.tsx")]),
			layout("safeRoutes/elasticUpgrade.tsx", [route("elastic/upgrade", "routes/clusterUpgrade.tsx")]),
			layout("safeRoutes/kibanaUpgrade.tsx", [route("kibana/upgrade", "routes/kibanaUpgrade.tsx")]),
		]),
	]),
	route("*", "routes/status/page404.tsx"),
] satisfies RouteConfig
