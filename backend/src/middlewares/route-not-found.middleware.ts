import { Request, Response, NextFunction } from "express";
import logger from "../logger/logger";

export const routeNotFoundMiddleware = (req: Request, res: Response, next: NextFunction) => {
	logger.info(`The requested route '${req.originalUrl}' was not found.`);
	res.status(404).json({
		error: "Not Found",
		path: req.originalUrl,
		message: `The requested route '${req.originalUrl}' was not found.`,
	});
};
