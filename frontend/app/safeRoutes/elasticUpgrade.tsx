import { Navigate, Outlet } from "react-router"
import useSafeRouteStore from "~/store/safeRoutes"

function ElasticUpgradeSafeRoute() {
	const canUpgrade = useSafeRouteStore((state) => state.elasticNodeUpgradeAllowed)

	return canUpgrade ? <Outlet /> : <Navigate to="/upgrade-assistant" />
}

export default ElasticUpgradeSafeRoute
