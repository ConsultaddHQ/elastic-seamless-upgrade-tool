import { Navigate, Outlet } from "react-router"
import useSafeRouteStore from "~/store/safeRoutes"

function PrecheckSafeRoute() {
	const canAccess = useSafeRouteStore((state) => state.precheckAllowed)

	return canAccess ? <Outlet /> : <Navigate to="/upgrade-assistant" />
}

export default PrecheckSafeRoute
