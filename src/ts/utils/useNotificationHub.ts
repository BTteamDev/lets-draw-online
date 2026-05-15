import { ref, computed } from 'vue';
import { api } from './api';
import { authState } from '../stores/auth';

export interface HubNotification {
    _id: string;
    type: 'admin_alert' | 'role_changed' | 'board_liked' | 'kicked' | 'system';
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
    metadata?: any;
}

const notifications = ref<HubNotification[]>([]);
const isLoading = ref(false);

export const useNotificationHub = () => {
    const unreadCount = computed(() => notifications.value.filter(n => !n.isRead).length);

    const fetchNotifications = async () => {
        const userId = authState.user?._id || authState.user?.id;
        if (!userId) return;
        isLoading.value = true;
        try {
            const res = await api.get('/notifications', { params: { userId } });
            notifications.value = res.data;
        } finally {
            isLoading.value = false;
        }
    };

    const markAsRead = async (id: string) => {
        await api.patch(`/notifications/${id}/read`, {});
        const n = notifications.value.find(n => n._id === id);
        if (n) n.isRead = true;
    };

    const markAllAsRead = async () => {
        const userId = authState.user?._id || authState.user?.id;
        await api.patch('/notifications/read-all', { userId });
        notifications.value.forEach(n => n.isRead = true);
    };

    const deleteOne = async (id: string) => {
        await api.delete(`/notifications/${id}`);
        notifications.value = notifications.value.filter(n => n._id !== id);
    };

    const deleteAll = async () => {
        const userId = authState.user?._id || authState.user?.id;
        await api.delete('/notifications', { data: { userId } });
        notifications.value = [];
    };

    const pushLocal = (notification: HubNotification) => {
        notifications.value.unshift(notification);
    };

    return {
        notifications,
        unreadCount,
        isLoading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteOne,
        deleteAll,
        pushLocal
    };
};