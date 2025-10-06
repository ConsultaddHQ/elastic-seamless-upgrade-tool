import { Navigate, Outlet, useParams } from "react-router"
import useSafeRouteStore from "~/store/safeRoutes"

function DeprecationSafeRoute() {
	const {clusterId} = useParams()
	const canResolveDeprecation = useSafeRouteStore((state) => state.deprecationChangesAllowed)

	return canResolveDeprecation ? <Outlet /> : <Navigate to={`/${clusterId}/upgrade-assistant`} />
}

export default DeprecationSafeRoute
