import { Navigate, Outlet } from "react-router"
import useSafeRouteStore from "~/store/safeRoutes"

function ClusterAddedSafeRoute() {
	const canAccess = useSafeRouteStore((state) => state.clusterAdded)

	return canAccess ? <Navigate to="/cluster-overview" /> : <Outlet />
}

export default ClusterAddedSafeRoute
