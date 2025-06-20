import "dotenv/config";
import http from "http";
import { Server, Socket } from "socket.io";
import webhookRouter from "./routes/webhook.router";
import elasticRouter from "./routes/elastic.router";
import settingsRouter from "./routes/settings.router";
import express, { Request, Response } from "express";
import cors from "cors";

import logger from "./logger/logger";
import { connectDB } from "./databases/db";
import { NotificationEvent, NotificationListner, notificationService } from "./services/notification.service";
import { routeNotFoundMiddleware } from "./middlewares/route-not-found.middleware";
import { errorMiddleware } from "./middlewares/error.middleware";

const app = express();
const server = http.createServer(app);

const PORT = 3000;

app.use(cors());
app.use(express.json());

app.get("/health", (req: Request, res: Response) => {
	res.send({
		message: "Server is healthy! 🚀",
	});
});

export interface ElasticClusterBaseRequest {
	url: string;
	apiKey?: string;
	username?: string;
	password?: string;
	bearer?: string;
	ssl: object;
}
export interface ElasticClusterHealthRequest extends ElasticClusterBaseRequest {}

//routes
app.use("/api/elastic/clusters", elasticRouter);
app.use("/api/settings", settingsRouter);
app.use("/webhook", webhookRouter);

app.use(routeNotFoundMiddleware);
// Centralised error handling
app.use(errorMiddleware);

const io = new Server(server, {
	transports: ["polling", "websocket", "webtransport"],
	cors: {
		origin: "*",
		methods: ["GET", "POST"],
		credentials: true,
	},
});

io.on("connection", (socket: Socket) => {
	logger.debug("User connected to socker.io with socketId:", socket.id);
	const notificationListner: NotificationListner = (event: NotificationEvent) => {
		socket.emit(event.type, event);
	};
	notificationService.addNotificationListner(notificationListner);
	socket.on("disconnect", () => {
		logger.debug("User disconnected from socker.io with socketId:", socket.id);
		notificationService.removeNotificationListner(notificationListner);
	});
});

connectDB().then(() => {
	server.listen(PORT, async () => {
		logger.info(`Server is running at http://localhost:${PORT}`);
	});
});
