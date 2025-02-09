import { type RouteConfig, index, layout, route } from "@react-router/dev/routes"

export default [
	layout("layouts/data.tsx", [index("routes/setup.tsx")]),
	layout("layouts/config.tsx", [
		route("cluster-overview", "routes/clusterOverview.tsx"),
		route("upgrade-assistant", "routes/upgradeAssist.tsx"),
	]),
	layout("layouts/common.tsx", [
		route("elastic/deprecation-logs", "routes/elasticDeprecationLogs.tsx"),
		route("elastic/upgrade", "routes/clusterUpgrade.tsx"),
		route("kibana/deprecation-logs", "routes/kibanaDeprecationLogs.tsx"),
		route("kibana/upgrade", "routes/kibanaUpgrade.tsx"),
	]),
] satisfies RouteConfig
