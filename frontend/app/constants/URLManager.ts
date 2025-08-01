const hostname = () => (typeof window !== "undefined" ? window.location.hostname : "")
const URLManager = {
	HTTP_BASE_URL: `http://107.22.133.148:8080/api/v1`,
	SOCKET_BASE_URL: `ws://107.22.133.148:8080/ws`,

	// HTTP_BASE_URL: `http://${hostname()}:8080/api/v1`,
	// HTTP_BASE_URL: "http://localhost:3000",
	// HTTP_BASE_URL: "http://54.91.120.67:3000/",
	// SOCKET_BASE_URL: `ws://${hostname()}:8080/ws`,

	REFRESH_TOKEN_URL: "/refresh",
} as const

export default URLManager
