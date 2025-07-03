import { Request, Response } from "express";
import logger from "../logger/logger";
import { ISettings } from "../models/settings.model";
import { settingService } from "../services/settings.service";

export const updateSettings = async (req: Request, res: Response) => {
	try {
		const { notificationWebhookUrl }: ISettings = req.body;
		settingService.updateSettings({ notificationWebhookUrl });
		res.send({ message: "Settings updated" });
	} catch (err: any) {
		logger.info(err);
		res.status(400).send({ err: err.message });
	}
};

export const getSettings = async (req: Request, res: Response) => {
	try {
		const settings = await settingService.getSettings();
		res.send({
			notificationWebhookUrl: settings?.notificationWebhookUrl || null,
		});
	} catch (err: any) {
		logger.info(err);
		res.status(400).send({ err: err.message });
	}
};
