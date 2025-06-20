import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors";
import logger from "../logger/logger";

export const errorMiddleware = (err: any, req: Request, res: Response, next: NextFunction) => {
	if (err instanceof AppError) {
		res.status(err.statusCode).json({ error: err.message });
	} else {
		logger.error(err);
		res.status(500).json({ error: "Internal Server Error" });
	}
};
