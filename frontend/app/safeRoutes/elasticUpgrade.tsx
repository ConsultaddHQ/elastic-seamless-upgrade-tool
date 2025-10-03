import { Navigate, Outlet, useParams } from "react-router"
import useSafeRouteStore from "~/store/safeRoutes"

function ElasticUpgradeSafeRoute() {
	const { clusterId } = useParams()
	const canUpgrade = useSafeRouteStore((state) => state.elasticNodeUpgradeAllowed)

	return canUpgrade ? <Outlet /> : <Navigate to={`/${clusterId}/upgrade-assistant`} />
}

export default ElasticUpgradeSafeRoute
