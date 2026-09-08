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
        const statusCode = error.response?.status
        const responseData = error.response?.data

        if (statusCode === 403) {
            const licenseErrorMsg = responseData?.message || "License validation failed."
            
            toast.error(licenseErrorMsg, {
                id: "license-403-error",
                duration: 8000, 
            })

        } else if (statusCode === 401) {
            toast.error(responseData?.err ?? StringManager.GENERIC_ERROR, {
                id: "auth-401-error"
            })
            resetAuthState()
            window.location.href = "/login"

        } else if (statusCode === 400) {
            toast.error(responseData?.err ?? StringManager.GENERIC_ERROR, {
                id: "bad-request-error"
            })
            if (responseData?.path === "/") resetAuthState()

        } else {
            // Fallback
            toast.error(responseData?.err ?? StringManager.GENERIC_ERROR, {
                id: "generic-error"
            })
        }

        return Promise.reject(error)
    }
)

export default axiosJSON