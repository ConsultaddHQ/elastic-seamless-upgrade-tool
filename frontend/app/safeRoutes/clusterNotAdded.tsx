import { Navigate, Outlet } from "react-router"
import useSafeRouteStore from "~/store/safeRoutes"

function ClusterNotAddedSafeRoute() {
	const canAccess = useSafeRouteStore((state) => state.clusterAdded)

	return canAccess ? <Outlet /> : <Navigate to="/" />
}

export default ClusterNotAddedSafeRoute
