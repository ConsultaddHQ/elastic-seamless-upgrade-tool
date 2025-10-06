import { Navigate, Outlet, useParams } from "react-router"
import useSafeRouteStore from "~/store/safeRoutes"

function KibanaUpgradeSafeRoute() {
	const { clusterId } = useParams()
	const canUpgrade = useSafeRouteStore((state) => state.kibanaNodeUpgradeAllowed)
	return !canUpgrade ? <Outlet /> : <Navigate to={`${clusterId}/upgrade-assistant`} />
}

export default KibanaUpgradeSafeRoute
