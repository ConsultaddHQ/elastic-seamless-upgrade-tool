import { Navigate, Outlet } from "react-router"
import useSafeRouteStore from "~/store/safeRoutes"

function KibanaUpgradeSafeRoute() {
	const canUpgrade = useSafeRouteStore((state) => state.kibanaNodeUpgradeAllowed)

	return canUpgrade ? <Outlet /> : <Navigate to="/upgrade-assistant" />
}

export default KibanaUpgradeSafeRoute
