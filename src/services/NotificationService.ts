import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Notification {
    id: string;
    type: 'transaction' | 'security' | 'system';
    title: string;
    message: string;
    timestamp: number;
    read: boolean;
    data?: any;
}

const NOTIFICATION_LOG_KEY = '@web3_notifications';

export class NotificationService {
    private static notifications: Notification[] = [];

    static async init() {
        const stored = await AsyncStorage.getItem(NOTIFICATION_LOG_KEY);
        if (stored) {
            this.notifications = JSON.parse(stored);
        }
    }

    static async notify(type: Notification['type'], title: string, message: string, data?: any) {
        const notification: Notification = {
            id: Date.now().toString(),
            type,
            title,
            message,
            timestamp: Date.now(),
            read: false,
            data
        };

        this.notifications = [notification, ...this.notifications].slice(0, 100); // Keep last 100
        await AsyncStorage.setItem(NOTIFICATION_LOG_KEY, JSON.stringify(this.notifications));

        // Notification added to log. UI can observe this or show its own alerts.
        return notification;
    }

    static getNotifications(): Notification[] {
        return this.notifications;
    }

    static async markAsRead(id: string) {
        this.notifications = this.notifications.map(n =>
            n.id === id ? { ...n, read: true } : n
        );
        await AsyncStorage.setItem(NOTIFICATION_LOG_KEY, JSON.stringify(this.notifications));
    }

    static async clearAll() {
        this.notifications = [];
        await AsyncStorage.removeItem(NOTIFICATION_LOG_KEY);
    }
}
