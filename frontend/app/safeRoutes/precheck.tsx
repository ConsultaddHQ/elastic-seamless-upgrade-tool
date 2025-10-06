import { Navigate, Outlet, useParams } from "react-router"
import useSafeRouteStore from "~/store/safeRoutes"

function PrecheckSafeRoute() {
	const canAccess = useSafeRouteStore((state) => state.precheckAllowed)
	const { clusterId } = useParams()
	return canAccess ? <Outlet /> : <Navigate to={`/${clusterId}/upgrade-assistant`} />
}

export default PrecheckSafeRoute
