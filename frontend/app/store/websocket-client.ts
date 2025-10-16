import { useLocalStore } from "./common"

type EventHandler = (...args: any[]) => void

interface WebSocketClientOptions {
	reconnect?: boolean
	reconnectInterval?: number
	maxRetries?: number
}

export class WebSocketClient {
	private socket: WebSocket | null = null
	private url: string
	private eventHandlers: Record<string, EventHandler[]> = {}
	private isConnected = false

	private reconnect: boolean
	private reconnectInterval: number
	private maxRetries: number
	private retryCount = 0
	private reconnectTimer?: NodeJS.Timeout

	constructor(url: string, options: WebSocketClientOptions = {}) {
		this.url = url
		this.reconnect = options.reconnect ?? true
		this.reconnectInterval = options.reconnectInterval ?? 3000
		this.maxRetries = options.maxRetries ?? Infinity
	}

	connect() {
		const token = useLocalStore.getState().sessionName
		this.socket = new WebSocket(`${this.url}?token=${token}`)

		this.socket.addEventListener("open", () => {
			this.isConnected = true
			this.retryCount = 0
			this.emitLocal("connect")
		})

		this.socket.addEventListener("message", (event) => {
			try {
				const data = JSON.parse(event.data)
				this.emitLocal(data.type, data)
			} catch {
				console.warn("Invalid WebSocket message:", event.data)
			}
		})

		this.socket.addEventListener("close", () => {
			this.isConnected = false
			this.emitLocal("disconnect")

			if (this.reconnect && this.retryCount < this.maxRetries) {
				this.scheduleReconnect()
			} else if (this.retryCount >= this.maxRetries) {
				this.emitLocal("reconnect_failed")
			}
		})

		this.socket.addEventListener("error", (err) => {
			this.emitLocal("error", err)
		})
	}

	disconnect() {
		this.reconnect = false
		this.reconnectTimer && clearTimeout(this.reconnectTimer)
		this.socket?.close()
	}

	emit(event: string, data?: any) {
		if (!this.isConnected || !this.socket) return
		const payload = JSON.stringify({ type: event, data })
		this.socket.send(payload)
	}

	on(event: string, handler: EventHandler) {
		if (!this.eventHandlers[event]) {
			this.eventHandlers[event] = []
		}
		this.eventHandlers[event].push(handler)
	}

	off(event: string, handler?: EventHandler) {
		if (!handler) {
			delete this.eventHandlers[event]
		} else {
			this.eventHandlers[event] = this.eventHandlers[event]?.filter((h) => h !== handler) || []
		}
	}

	private emitLocal(event: string, ...args: any[]) {
		this.eventHandlers[event]?.forEach((fn) => fn(...args))
	}

	private scheduleReconnect() {
		this.retryCount++
		this.emitLocal("reconnect_attempt", this.retryCount)

		this.reconnectTimer = setTimeout(() => {
			this.connect()
		}, this.reconnectInterval)
	}
}
