import { type RouteConfig, index, layout, route } from "@react-router/dev/routes"

export default [
	layout("safeRoutes/clusterAdded.tsx", [layout("layouts/data.tsx", [index("routes/setup.tsx")])]),
	layout("safeRoutes/clusterNotAdded.tsx", [
		layout("layouts/config.tsx", [
			route("cluster-overview", "routes/clusterOverview.tsx"),
			route("upgrade-assistant", "routes/upgradeAssist.tsx"),
		]),
		layout("layouts/common.tsx", [
			layout("safeRoutes/deprecation.tsx", [
				route("elastic/deprecation-logs", "routes/elasticDeprecationLogs.tsx"),
				route("kibana/deprecation-logs", "routes/kibanaDeprecationLogs.tsx"),
			]),
			layout("safeRoutes/elasticUpgrade.tsx", [route("elastic/upgrade", "routes/clusterUpgrade.tsx")]),
			layout("safeRoutes/kibanaUpgrade.tsx", [route("kibana/upgrade", "routes/kibanaUpgrade.tsx")]),
		]),
	]),
	route("*", "routes/status/page404.tsx"),
] satisfies RouteConfig
