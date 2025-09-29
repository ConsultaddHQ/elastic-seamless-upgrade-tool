const hostname = () => (typeof window !== "undefined" ? window.location.hostname : "")
const URLManager = {
	HTTP_BASE_URL: `https://${hostname()}:8080/api/v1`,
	SOCKET_BASE_URL: `wss://${hostname()}:8080/ws`,
	// HTTP_BASE_URL: `http://107.22.133.148:8080/api/v1`,
	// SOCKET_BASE_URL: `ws://107.22.133.148:8080/ws`,

	REFRESH_TOKEN_URL: "/refresh",
} as const

export default URLManager
