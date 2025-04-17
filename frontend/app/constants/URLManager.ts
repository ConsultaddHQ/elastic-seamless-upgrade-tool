const hostname = () => (typeof window !== "undefined" ? window.location.hostname : "")
const URLManager = {
	HTTP_BASE_URL: `http://${hostname()}:3000`,
	// HTTP_BASE_URL: "http://localhost:3000",
	// HTTP_BASE_URL: "http://54.91.120.67:3000/",
	SOCKET_BASE_URL: `ws://${hostname()}:3000/notification`,

	REFRESH_TOKEN_URL: "/refresh",
} as const

export default URLManager
