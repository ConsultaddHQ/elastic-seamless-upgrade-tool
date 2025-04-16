import { Navigate, Outlet } from "react-router"
import useSafeRouteStore from "~/store/safeRoutes"

function DeprecationSafeRoute() {
	const canResolveDeprecation = useSafeRouteStore((state: any) => state.deprecationChangesAllowed)

	return canResolveDeprecation ? <Outlet /> : <Navigate to="/upgrade-assistant" />
}

export default DeprecationSafeRoute
