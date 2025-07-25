import axios from "axios"
import { useLocalStore } from "~/store/common"
import URLManager from "../constants/URLManager"

let axiosJSON = axios.create({
	baseURL: URLManager.HTTP_BASE_URL,
	headers: {
		"Content-Type": "application/json",
	},
	timeout: 60000,
})

let refreshPromise: any | null = null
const clearPromise = () => (refreshPromise = null)

const resetAuthState = () => {
	// @ts-ignore
	const setSession = useLocalStore.getState().setSessionName
	setSession("")
	// LocalStorageHandler.removeItem(StorageManager.SESSION_NAME)
}

const getRefreshToken = async (token: string) => {
	return await axiosJSON
		.post(`${URLManager.REFRESH_TOKEN_URL}?refreshTokenId=${token}`)
		.then((res) => res)
		.catch((error) => {
			// @ts-ignore
			const reset = useLocalStore.getState().reset
			reset()
		})
}

axiosJSON.interceptors.request.use(
	(config) => {
		// @ts-ignore
		const session = useLocalStore.getState().sessionName

		config.headers.authorization = `Bearer ${session}`
		config.headers.Accept = "application/json"
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
		const state = useLocalStore.getState()
		// @ts-ignore
		const session = state.sessionName
		// @ts-ignore
		const setSession = state.setSessionName
		let originalRequest = error.config

		if (error.response.data.path === "/refresh") {
			resetAuthState()
		} else if (
			error.response.status === 403 &&
			!(error.response.data.path === "/login") &&
			error.response.data !== "User does not has permission to disable asked account."
		) {
			if (!refreshPromise) {
				refreshPromise = getRefreshToken(session as string).finally(clearPromise)
			}

			const res = await refreshPromise

			if (!Boolean(res)) {
				resetAuthState()
				return Promise.reject(error)
			}

			setSession(res.data.session)

			originalRequest.headers.authorization = `Bearer ${res?.data?.accessToken || session}`

			return axiosJSON(originalRequest)
		} else if (error.response.status === 400) {
			if (error.response.data.path === "/") resetAuthState()
		} else if (error.response.status === 500 || error.response.status === 502) {
			// window.open(`/page500`, "_self")
		}

		return Promise.reject(error)
	}
)

export default axiosJSON
