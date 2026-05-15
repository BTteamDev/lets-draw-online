<template>
    <div class="hub-wrapper">
        <div class="hub-page">
            <div class="hub-header">
                <div class="header-left">
                    <h1><i class="fa-solid fa-bell"></i> Центр уведомлений</h1>
                    <span class="unread-badge" v-if="unreadCount > 0">
                        {{ unreadCount }} непрочитанных
                    </span>
                </div>
                <div class="header-actions">
                    <button @click="markAllAsRead" :disabled="unreadCount === 0" class="action-btn secondary">
                        <i class="fa-solid fa-check-double"></i> Прочитать все
                    </button>
                    <button @click="confirmDeleteAll" :disabled="notifications.length === 0" class="action-btn danger">
                        <i class="fa-solid fa-trash-can"></i> Очистить всё
                    </button>
                </div>
            </div>

            <div class="filters">
                <button v-for="f in filters" :key="f.value"
                    :class="['filter-btn', { active: activeFilter === f.value }]" @click="activeFilter = f.value">
                    <i :class="f.icon"></i> {{ f.label }}
                    <span v-if="f.count > 0" class="filter-count">{{ f.count }}</span>
                </button>
            </div>

            <div v-if="isLoading" class="loading-state">
                <i class="fa-solid fa-circle-notch fa-spin"></i>
                <span>Загружаем уведомления...</span>
            </div>

            <div v-else-if="filteredNotifications.length === 0" class="empty-state">
                <i class="fa-regular fa-bell-slash"></i>
                <p>{{ activeFilter === 'all' ? 'У вас пока нет уведомлений' : 'Нет уведомлений этого типа' }}</p>
            </div>

            <div v-else class="notif-list">
                <TransitionGroup name="list">
                    <div v-for="n in filteredNotifications" :key="n._id" class="notif-card"
                        :class="{ unread: !n.isRead }">
                        <div class="notif-icon" :class="n.type">
                            <i :class="iconMap[n.type]"></i>
                        </div>

                        <div class="notif-content">
                            <div class="notif-top">
                                <span class="notif-title">{{ n.title }}</span>
                                <div class="notif-meta">
                                    <span class="notif-time">{{ formatTime(n.createdAt) }}</span>
                                    <span v-if="!n.isRead" class="unread-dot"></span>
                                </div>
                            </div>
                            <p class="notif-message">{{ n.message }}</p>
                            <span class="type-tag" :class="n.type">{{ typeLabels[n.type] }}</span>
                        </div>

                        <div class="notif-actions">
                            <button v-if="!n.isRead" @click="markAsRead(n._id)" class="icon-btn read-btn"
                                title="Пометить прочитанным">
                                <i class="fa-solid fa-check"></i>
                            </button>
                            <button @click="deleteOne(n._id)" class="icon-btn delete-btn" title="Удалить">
                                <i class="fa-solid fa-xmark"></i>
                            </button>
                        </div>
                    </div>
                </TransitionGroup>
            </div>
        </div>
        <NotificationList />
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useNotificationHub } from '@/ts/utils/useNotificationHub';
import NotificationList from '@/components/notification/NotificationList.vue';
import { useNotifications } from '@/ts/utils/notifications';

const { notifications, unreadCount, isLoading, fetchNotifications, markAsRead, markAllAsRead, deleteOne, deleteAll } = useNotificationHub();
const { addNotify } = useNotifications();

const activeFilter = ref<string>('all');

const iconMap: Record<string, string> = {
    admin_alert: 'fa-solid fa-bullhorn',
    role_changed: 'fa-solid fa-shield-halved',
    board_liked: 'fa-solid fa-heart',
    kicked: 'fa-solid fa-user-slash',
    system: 'fa-solid fa-gear',
};

const typeLabels: Record<string, string> = {
    admin_alert: 'Администрация',
    role_changed: 'Роль',
    board_liked: 'Лайк',
    kicked: 'Исключение',
    system: 'Система',
};

const filters = computed(() => [
    { value: 'all', label: 'Все', icon: 'fa-solid fa-inbox', count: notifications.value.filter(n => !n.isRead).length },
    { value: 'admin_alert', label: 'Администрация', icon: 'fa-solid fa-bullhorn', count: notifications.value.filter(n => n.type === 'admin_alert' && !n.isRead).length },
    { value: 'role_changed', label: 'Роли', icon: 'fa-solid fa-shield-halved', count: notifications.value.filter(n => n.type === 'role_changed' && !n.isRead).length },
    { value: 'board_liked', label: 'Лайки', icon: 'fa-solid fa-heart', count: notifications.value.filter(n => n.type === 'board_liked' && !n.isRead).length },
    { value: 'kicked', label: 'Исключения', icon: 'fa-solid fa-user-slash', count: notifications.value.filter(n => n.type === 'kicked' && !n.isRead).length },
]);

const filteredNotifications = computed(() => {
    if (activeFilter.value === 'all') return notifications.value;
    return notifications.value.filter(n => n.type === activeFilter.value);
});

const confirmDeleteAll = async () => {
    if (!confirm('Удалить все уведомления? Это действие необратимо.')) return;
    await deleteAll();
    addNotify('success', 'Все уведомления удалены');
};

const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'только что';
    if (mins < 60) return `${mins} мин. назад`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} ч. назад`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} дн. назад`;
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
};

onMounted(fetchNotifications);
</script>

<style scoped>
.hub-page {
    max-width: 780px;
    margin: 0 auto;
    padding: 40px 20px;
    min-height: calc(100vh - 70px);
}

.hub-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 28px;
    flex-wrap: wrap;
    gap: 16px;
}

.header-left {
    display: flex;
    align-items: center;
    gap: 12px;
}

.header-left h1 {
    font-size: 1.6rem;
    font-weight: 800;
    margin: 0;
    color: var(--text-main);
    display: flex;
    align-items: center;
    gap: 12px;
}

.header-left h1 i {
    color: var(--accent-blue);
}

.unread-badge {
    background: rgba(52, 152, 219, 0.12);
    color: var(--accent-blue);
    font-size: 0.75rem;
    font-weight: 700;
    padding: 4px 12px;
    border-radius: 20px;
    border: 1px solid rgba(52, 152, 219, 0.2);
}

.header-actions {
    display: flex;
    gap: 8px;
}

.action-btn {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 8px 16px;
    border-radius: var(--radius-sm);
    border: none;
    cursor: pointer;
    font-size: 0.82rem;
    font-weight: 700;
    transition: var(--btn-transition);
}

.action-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

.action-btn.secondary {
    background: var(--input-bg);
    color: var(--text-main);
}

.action-btn.secondary:hover:not(:disabled) {
    background: var(--accent-blue);
    color: white;
}

.action-btn.danger {
    background: rgba(255, 71, 87, 0.1);
    color: var(--color-danger);
}

.action-btn.danger:hover:not(:disabled) {
    background: var(--color-danger);
    color: white;
}

.filters {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 24px;
}

.filter-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 7px 14px;
    border-radius: 20px;
    border: 1px solid var(--glass-border);
    background: var(--card-bg);
    color: var(--text-muted);
    cursor: pointer;
    font-size: 0.78rem;
    font-weight: 600;
    transition: var(--btn-transition);
}

.filter-btn:hover {
    border-color: var(--accent-blue);
    color: var(--accent-blue);
}

.filter-btn.active {
    background: var(--accent-blue);
    color: white;
    border-color: var(--accent-blue);
}

.filter-count {
    background: rgba(255, 255, 255, 0.25);
    padding: 1px 6px;
    border-radius: 10px;
    font-size: 0.65rem;
}

.filter-btn:not(.active) .filter-count {
    background: var(--input-bg);
    color: var(--text-muted);
}

.loading-state,
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 80px 20px;
    color: var(--text-muted);
    background: var(--card-bg);
    border-radius: var(--radius-main);
    border: 1px dashed var(--glass-border);
}

.loading-state i,
.empty-state i {
    font-size: 2rem;
    opacity: 0.4;
}

.empty-state p {
    font-size: 0.9rem;
}

.notif-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.notif-card {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    padding: 16px;
    background: var(--card-bg);
    border-radius: var(--radius-main);
    border: 1px solid var(--glass-border);
    box-shadow: var(--card-shadow);
    transition: box-shadow 0.2s, border-color 0.2s;
    position: relative;
}

.notif-card:hover {
    box-shadow: var(--card-shadow-hover);
}

.notif-card.unread {
    border-color: rgba(52, 152, 219, 0.2);
    background: color-mix(in srgb, var(--card-bg), var(--accent-blue) 3%);
}

.notif-card.unread::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: var(--accent-blue);
    border-radius: var(--radius-main) 0 0 var(--radius-main);
}

.notif-icon {
    width: 42px;
    height: 42px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    flex-shrink: 0;
}

.notif-icon.admin_alert {
    background: rgba(255, 165, 2, 0.12);
    color: var(--color-warning);
}

.notif-icon.role_changed {
    background: rgba(52, 152, 219, 0.12);
    color: var(--accent-blue);
}

.notif-icon.board_liked {
    background: rgba(255, 71, 87, 0.12);
    color: var(--color-danger);
}

.notif-icon.kicked {
    background: rgba(99, 110, 114, 0.12);
    color: var(--text-muted);
}

.notif-icon.system {
    background: rgba(155, 89, 182, 0.12);
    color: var(--accent-purple);
}

.notif-content {
    flex: 1;
    min-width: 0;
}

.notif-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 5px;
    gap: 12px;
}

.notif-title {
    font-size: 0.9rem;
    font-weight: 700;
    color: var(--text-main);
}

.notif-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
}

.notif-time {
    font-size: 0.7rem;
    color: var(--text-muted);
    white-space: nowrap;
}

.unread-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--accent-blue);
    flex-shrink: 0;
}

.notif-message {
    font-size: 0.82rem;
    color: var(--text-muted);
    margin: 0 0 8px;
    line-height: 1.5;
}

.type-tag {
    display: inline-block;
    font-size: 0.62rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: 2px 8px;
    border-radius: 10px;
}

.type-tag.admin_alert {
    background: rgba(255, 165, 2, 0.12);
    color: var(--color-warning);
}

.type-tag.role_changed {
    background: rgba(52, 152, 219, 0.12);
    color: var(--accent-blue);
}

.type-tag.board_liked {
    background: rgba(255, 71, 87, 0.12);
    color: var(--color-danger);
}

.type-tag.kicked {
    background: rgba(99, 110, 114, 0.12);
    color: var(--text-muted);
}

.type-tag.system {
    background: rgba(155, 89, 182, 0.12);
    color: var(--accent-purple);
}

.notif-actions {
    display: flex;
    gap: 4px;
    flex-shrink: 0;
}

.icon-btn {
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-sm);
    border: none;
    cursor: pointer;
    font-size: 0.8rem;
    transition: var(--btn-transition);
    background: var(--input-bg);
    color: var(--text-muted);
}

.read-btn:hover {
    background: var(--color-online);
    color: white;
}

.delete-btn:hover {
    background: var(--color-danger);
    color: white;
}

.list-enter-active,
.list-leave-active {
    transition: all 0.25s ease;
}

.list-enter-from {
    opacity: 0;
    transform: translateY(-10px);
}

.list-leave-to {
    opacity: 0;
    transform: translateX(20px);
}
</style>