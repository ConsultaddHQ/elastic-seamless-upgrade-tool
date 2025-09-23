import { Navigate, Outlet } from "react-router"
import useSafeRouteStore from "~/store/safeRoutes"

function UpgradeAssistSafeRoute() {
	const canAccess = useSafeRouteStore((state) => state.upgradeAssistAllowed)

	return canAccess ? <Navigate to="/cluster-overview" /> : <Outlet />
}

export default UpgradeAssistSafeRoute
