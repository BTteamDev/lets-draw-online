import { ref } from 'vue';
import type { Notification, NotifyType } from './interfaces';

const notifications = ref<Notification[]>([]);

export const useNotifications = () => {
    const addNotify = (type: NotifyType, message: string, duration = 5000) => {
        const id = Math.random().toString(36).substring(2, 9);
        notifications.value.push({ id, type, message });

        if (duration > 0) {
            setTimeout(() => removeNotify(id), duration);
        }
    };

    const removeNotify = (id: string) => {
        notifications.value = notifications.value.filter(n => n.id !== id);
    };

    return { notifications, addNotify, removeNotify };
};