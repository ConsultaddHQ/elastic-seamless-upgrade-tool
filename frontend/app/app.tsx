import { Outlet } from "react-router"

function MainApp() {
	// const setClusterAdded = useSafeRouteStore((state: any) => state.setClusterAdded)
	// const setClusterId = useLocalStore((state: any) => state.setClusterId)
	// const setInfraType = useLocalStore((state: any) => state.setInfraType)
	// const setDeploymentId = useLocalStore((state: any) => state.setDeploymentId)

	// const getCluster = async () => {
	// 	await axiosJSON
	// 		.get("/clusters/verify")
	// 		.then((res) => {
	// 			setClusterAdded(res?.data?.clusterAvailable)
	// 			setClusterId(res?.data?.cluster?.id)
	// 			setInfraType(res?.data?.cluster?.type)
	// 			setDeploymentId(res?.data?.cluster?.deploymentId || "")
	// 		})
	// 		.catch((err) => toast.error(err?.response?.data.err ?? StringManager.GENERIC_ERROR))
	// }

	// useEffect(() => {
	// 	getCluster()
	// }, [])

	return <Outlet />
}

export default MainApp
