export enum NotificationEventType {
	UPGRADE_PROGRESS_CHANGE = "UPGRADE_PROGRESS_CHANGE",
	PRECHECK_PROGRESS_CHANGE = "PRECHECK_PROGRESS_CHANGE",
	UPGRADE_STATUS_CHANGE = "UPGRADE_STATUS_CHANGE",
}

export interface NotificationEvent {
	type: NotificationEventType;
	[key: string]: any;
}

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
