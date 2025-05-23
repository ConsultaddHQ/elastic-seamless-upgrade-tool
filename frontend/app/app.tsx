import { useEffect } from "react"
import { useDispatch } from "react-redux"
import { Outlet } from "react-router"
import { toast } from "sonner"
import axiosJSON from "./apis/http"
import { setClusterAdded } from "./store/reducers/safeRoutes"
import StringManager from "./constants/StringManager"

function MainApp() {
	const dispatch = useDispatch()

	const getCluster = async () => {
		await axiosJSON
			.get("/api/elastic/clusters/verify")
			.then((res) => dispatch(setClusterAdded(res?.data?.clusterAvailable)))
			.catch((err) => toast.error(err?.response?.data.err ?? StringManager.GENERIC_ERROR))
	}

	useEffect(() => {
		getCluster()
	}, [])

	return <Outlet />
}

export default MainApp
