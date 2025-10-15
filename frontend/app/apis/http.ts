import axios from "axios"
import { useLocalStore } from "../store/common"
import URLManager from "../constants/URLManager"
import { toast } from "sonner"
import StringManager from "../constants/StringManager"

const axiosJSON = axios.create({
	baseURL: URLManager.HTTP_BASE_URL,
	headers: {
		"Content-Type": "application/json",
	},
	timeout: 60000,
})

const resetAuthState = () => {
	const setSession = useLocalStore.getState().setSessionName
	setSession("")
}

axiosJSON.interceptors.request.use(
	(config) => {
		const session = useLocalStore.getState().sessionName
		if (session) {
			config.headers.authorization = `Bearer ${session}`
			config.headers.Accept = "application/json"
		}
		return config
	},
	(error) => {
		return Promise.reject(error)
	}
)

axiosJSON.interceptors.response.use(
	(res) => {
		return res
	},
	async (error) => {
		toast.error(error?.response?.data.err ?? StringManager.GENERIC_ERROR)
		const statusCode = error.response.status

		if (statusCode == 401 || statusCode == 403) {
			resetAuthState()
			window.location.href = "/login"
		} else if (statusCode === 400) {
			if (error.response.data.path === "/") resetAuthState()
		}

		return Promise.reject(error)
	}
)

export default axiosJSON
