<template>
    <div class="admin-events-template-wrapper">
        <div class="admin-page">
            <div class="admin-header">
                <h2>
                    <i id="icon" class="fa-solid fa-newspaper"></i>
                    Системные логи
                </h2>
            </div>
            <div class="event-list">
                <div v-for="event in events" :key="event._id" :class="['event-item', event.type]">
                    <span class="event-time">{{ new Date(event.timestamp).toLocaleString() }}</span>
                    <span :class="['event-type', event.type]">[{{ event.type.toUpperCase() }}]</span>
                    <span class="event-msg">{{ event.message }}</span>
                </div>
            </div>
        </div>
        <NotificationList />
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '@/ts/utils/api';
import { useNotifications } from '@/ts/utils/notifications';
import NotificationList from '@/components/notification/NotificationList.vue';
import { authState } from '@/ts/store/auth';

const { addNotify } = useNotifications();

interface AppEvent {
    _id: string;
    type: 'error' | 'warning' | 'info' | 'auth' | 'report';
    message: string;
    timestamp: string;
    metadata?: any;
}

const events = ref<AppEvent[]>([]);
const isLoading = ref(true);

onMounted(async () => {
    try {
        const res = await api.get('/admin/events', {
            headers: {
                'x-user-id': authState.user?.id || authState.user?._id
            }
        });
        events.value = res.data;
    } catch (e) {
        addNotify('error', `Доступ запрещен или ошибка сервера`);
    }
});
</script>

<style scoped>
.event-list {
    display: flex;
    flex-direction: column;
    gap: 5px;
    font-family: monospace;
}

.event-item {
    padding: 8px;
    border-left: 4px solid #ccc;
    background: var(--glass-bg);
    font-size: 0.9rem;
}

.error {
    border-color: var(--color-danger);
    color: #ff8080;
}

.warning {
    border-color: var(--color-warning);
}

.auth {
    border-color: var(--accent-purple);
}

.info {
    border-color: var(--color-info);
}

.event-time {
    color: var(--text-muted);
    margin-right: 10px;
}

.event-type {
    font-weight: bold;
    margin-right: 10px;
}

.event-type.warning {
    color: var(--color-warning)
}

.event-type.info {
    color: var(--color-info);
}

.event-type.error {
    color: var(--color-danger);
}

.event-type.auth {
    color: var(--accent-purple);
}

.event-msg {
    color: var(--text-main);
}
</style>