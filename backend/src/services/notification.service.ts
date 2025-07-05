import axios from "axios";
import { settingService } from "./settings.service";
import { syncClusterUpgradeJobStatus, syncKibanaNodes } from "./sync.service";

export enum NotificationEventType {
	UPGRADE_PROGRESS_CHANGE = "UPGRADE_PROGRESS_CHANGE",
	PRECHECK_PROGRESS_CHANGE = "PRECHECK_PROGRESS_CHANGE",
	CLUSTER_INFO_CHANGE = "CLUSTER_INFO_CHANGE",
	NOTIFICATION = "NOTIFICATION",
}

export interface UpgradeProgressChangeEvent {
	type: NotificationEventType.UPGRADE_PROGRESS_CHANGE;
}

export interface PrecheckProgressChangeEvent {
	type: NotificationEventType.PRECHECK_PROGRESS_CHANGE;
}

export interface ClusterInfoChangeEvent {
	type: NotificationEventType.CLUSTER_INFO_CHANGE;
}

export enum NotificationType {
	SUCCESS = "success",
	ERROR = "error",
}
export interface GeneralNotificationEvent {
	type: NotificationEventType.NOTIFICATION;
	notificationType: NotificationType;
	message: string;
	title: string;
	clusterId?: string | undefined;
}

export type NotificationEvent =
	| UpgradeProgressChangeEvent
	| PrecheckProgressChangeEvent
	| ClusterInfoChangeEvent
	| GeneralNotificationEvent;

export type NotificationListner = (event: NotificationEvent) => void;

class NotificationService {
	notificationListners: NotificationListner[] = [];
	async sendNotification(notification: NotificationEvent) {
		this.notificationListners.forEach((listener) => listener(notification));
	}
	addNotificationListner(callback: NotificationListner) {
		this.notificationListners.push(callback);
	}
	removeNotificationListner(callback: NotificationListner) {
		this.notificationListners = this.notificationListners.filter((listener) => listener !== callback);
	}
}

export const notificationService = new NotificationService();

notificationService.addNotificationListner(async (event) => {
	if (event.type === NotificationEventType.NOTIFICATION) {
		const settings = await settingService.getSettings();
		if (settings && settings.notificationWebhookUrl) {
			const data = JSON.stringify(event);
			axios
				.post(settings.notificationWebhookUrl, data, {
					headers: {
						"Content-Type": "application/json",
					},
				})
				.then(() => {
					console.log("Notification sent successfully.");
				})
				.catch((error) => {
					console.error("Failed to send notification:", error.message);
				});
		}
	}
});

notificationService.addNotificationListner(async (event) => {
	if (
		event.type === NotificationEventType.NOTIFICATION &&
		event.notificationType === NotificationType.SUCCESS &&
		event.clusterId
	) {
		await syncKibanaNodes(event.clusterId);
		await syncClusterUpgradeJobStatus(event.clusterId);
	}
});
