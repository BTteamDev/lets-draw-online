<template>
    <div class="bell-wrapper" ref="bellRef">
        <button class="bell-btn" @click="toggleDropdown" :class="{ active: isOpen }">
            <i class="fa-solid fa-bell"></i>
            <span v-if="unreadCount > 0" class="badge">{{ unreadCount > 9 ? '9+' : unreadCount }}</span>
        </button>

        <Transition name="dropdown">
            <div v-if="isOpen" class="bell-dropdown">
                <div class="dropdown-header">
                    <span class="dropdown-title">Уведомления</span>
                    <button v-if="unreadCount > 0" @click="markAllAsRead" class="mark-all-btn">
                        Прочитать все
                    </button>
                </div>

                <div v-if="notifications.length === 0" class="dropdown-empty">
                    <i class="fa-regular fa-bell-slash"></i>
                    <span>Нет уведомлений</span>
                </div>

                <div v-else class="dropdown-list">
                    <div v-for="n in notifications.slice(0, 3)" :key="n._id" class="notif-item"
                        :class="{ unread: !n.isRead }" @click="markAsRead(n._id)">
                        <div class="notif-icon" :class="n.type">
                            <i :class="iconMap[n.type]"></i>
                        </div>
                        <div class="notif-body">
                            <p class="notif-title">{{ n.title }}</p>
                            <p class="notif-msg">{{ n.message }}</p>
                            <span class="notif-time">{{ formatTime(n.createdAt) }}</span>
                        </div>
                    </div>
                </div>

                <router-link to="/notifications" class="dropdown-footer" @click="isOpen = false">
                    <span>Все уведомления</span>
                    <i class="fa-solid fa-arrow-right"></i>
                </router-link>
            </div>
        </Transition>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useNotificationHub } from '@/ts/utils/useNotificationHub';

const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotificationHub();

const isOpen = ref(false);
const bellRef = ref<HTMLElement | null>(null);

const iconMap: Record<string, string> = {
    admin_alert: 'fa-solid fa-bullhorn',
    role_changed: 'fa-solid fa-shield-halved',
    board_liked: 'fa-solid fa-heart',
    kicked: 'fa-solid fa-user-slash',
    system: 'fa-solid fa-gear',
};

const toggleDropdown = () => { isOpen.value = !isOpen.value; };

const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'только что';
    if (mins < 60) return `${mins} мин. назад`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} ч. назад`;
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
};

const onClickOutside = (e: MouseEvent) => {
    if (bellRef.value && !bellRef.value.contains(e.target as Node)) {
        isOpen.value = false;
    }
};

onMounted(() => document.addEventListener('mousedown', onClickOutside));
onBeforeUnmount(() => document.removeEventListener('mousedown', onClickOutside));
</script>

<style scoped>
.bell-wrapper {
    position: relative;
}

.bell-btn {
    position: relative;
    width: 38px;
    height: 38px;
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-sm);
    color: var(--accent-blue);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    transition: var(--btn-transition);
}

.bell-btn:hover,
.bell-btn.active {
    background: var(--bg-accent);
    transform: translateY(-1px);
    box-shadow: var(--card-shadow);
}

.badge {
    position: absolute;
    top: -5px;
    right: -5px;
    min-width: 18px;
    height: 18px;
    background: var(--color-danger);
    color: white;
    border-radius: 20px;
    font-size: 0.6rem;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 4px;
    border: 2px solid var(--header-bg);
    animation: pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes pop {
    from {
        transform: scale(0);
    }

    to {
        transform: scale(1);
    }
}

.bell-dropdown {
    position: absolute;
    top: calc(100% + 10px);
    right: 0;
    width: 320px;
    background: var(--card-bg);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-main);
    box-shadow: var(--card-shadow-hover);
    overflow: hidden;
    z-index: 2000;
}

.dropdown-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    border-bottom: 1px solid var(--glass-border);
}

.dropdown-title {
    font-size: 0.85rem;
    font-weight: 800;
    color: var(--text-main);
}

.mark-all-btn {
    background: none;
    border: none;
    font-size: 0.72rem;
    color: var(--accent-blue);
    cursor: pointer;
    font-weight: 600;
    padding: 0;
}

.mark-all-btn:hover {
    text-decoration: underline;
}

.dropdown-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 30px 16px;
    color: var(--text-muted);
    font-size: 0.85rem;
}

.dropdown-empty i {
    font-size: 1.8rem;
    opacity: 0.4;
}

.dropdown-list {
    max-height: 300px;
    overflow-y: auto;
}

.notif-item {
    display: flex;
    gap: 12px;
    padding: 12px 16px;
    border-bottom: 1px solid var(--glass-border);
    cursor: pointer;
    transition: background 0.15s;
    position: relative;
}

.notif-item:last-child {
    border-bottom: none;
}

.notif-item:hover {
    background: var(--input-bg);
}

.notif-item.unread {
    background: color-mix(in srgb, var(--card-bg), var(--accent-blue) 4%);
}

.notif-item.unread::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: var(--accent-blue);
    border-radius: 0 2px 2px 0;
}

.notif-icon {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
    flex-shrink: 0;
}

.notif-icon.admin_alert {
    background: rgba(255, 165, 2, 0.15);
    color: var(--color-warning);
}

.notif-icon.role_changed {
    background: rgba(52, 152, 219, 0.15);
    color: var(--accent-blue);
}

.notif-icon.board_liked {
    background: rgba(255, 71, 87, 0.15);
    color: var(--color-danger);
}

.notif-icon.kicked {
    background: rgba(99, 110, 114, 0.15);
    color: var(--text-muted);
}

.notif-icon.system {
    background: rgba(155, 89, 182, 0.15);
    color: var(--accent-purple);
}

.notif-body {
    flex: 1;
    min-width: 0;
}

.notif-title {
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--text-main);
    margin: 0 0 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.notif-msg {
    font-size: 0.75rem;
    color: var(--text-muted);
    margin: 0 0 4px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.notif-time {
    font-size: 0.65rem;
    color: var(--text-muted);
    opacity: 0.7;
}

.dropdown-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-top: 1px solid var(--glass-border);
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--accent-blue);
    text-decoration: none;
    transition: background 0.15s;
}

.dropdown-footer:hover {
    background: var(--input-bg);
}

.dropdown-enter-active,
.dropdown-leave-active {
    transition: opacity 0.15s ease, transform 0.15s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
    opacity: 0;
    transform: translateY(-6px);
}
</style>