<template>
<div class="admin-users-template-wrapper">
        <div class="admin-users">
        <div class="admin-header">
            <h2>
                <i id="icon" class="fa-solid fa-circle-user"></i>
                Управление пользователями
            </h2>
            <p>Найдено пользователей:
                <i v-if="isLoading" class="fa-solid fa-circle-notch fa-spin"></i>
                {{ isLoading ? '' : users.length }}
            </p>
            <div class="search-bar">
                <i class="fa-solid fa-magnifying-glass"></i>
                <input v-model="searchQuery" @input="fetchUsers"
                    placeholder="Поиск... (поддержка @name=, @email=, @id=)" />
            </div>
        </div>

        <div class="user-list">
            <div v-for="user in users" :key="user._id" class="user-card">
                <div class="user-main-info">
                    <img v-if="user.avatarUrl" :src="user.avatarUrl" class="user-avatar" />
                    <div class="user-avatar" v-if="!user.avatarUrl">{{ user.username[0]?.toUpperCase() }}</div>
                    <div class="user-details">
                        <router-link :to="`/admin/users/${user._id}`" style="text-decoration: none;"><span
                                class="username">{{ user.username }}</span></router-link>
                        <span class="email">{{ user.email }}</span>
                    </div>
                </div>

                <div class="user-meta">
                    <span class="origin-tag">IP: ???.???.???.???</span>
                    <span v-if="user.role !== 'viewer'" :class="['role-badge', user.role]">{{ user.role }}</span>
                </div>

                <div class="user-actions">
                    <div class="note-container">
                        <button @click="toggleNote(user)" class="note-btn" :class="{ 'has-note': user.note }">
                            <i class="fa-solid fa-note-sticky"></i>
                        </button>

                        <div v-if="activeNoteId === user._id" class="note-edit-popover">
                            <textarea v-model="user.note" @blur="saveNote(user)" placeholder="Текст заметки..."
                                autofocus></textarea>
                        </div>
                    </div>

                    <div class="action-buttons">
                        <button class="btn-ban" title="Бан" @click="toggleBan(user)"
                            :style="user.isBanned ? 'color: var(--color-danger)' : ''"><i
                                class="fa-solid fa-ban"></i></button>
                        <button class="btn-mute" title="Мут" @click="toggleMute(user)"
                            :style="user.isMuted ? 'color: var(--color-danger)' : ''"><i
                                class="fa-solid fa-microphone-slash"></i></button>
                        <button class="btn-shadow" title="Shadowban"><i class="fa-solid fa-eye-slash"></i></button>
                        <button class="btn-delete" @click="deleteUser(user._id)" title="Удалить аккаунт"><i
                                class="fa-solid fa-trash-can"></i></button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <NotificationList />
</div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { api } from '@/ts/utils/api';
import { authState } from '@/ts/store/auth';
import { useNotifications } from '@/ts/utils/notifications';
import NotificationList from '@/components/notification/NotificationList.vue';
import type { AdminUser } from '@/ts/utils/interfaces'

const { addNotify } = useNotifications();

const users = ref<AdminUser[]>([]);
const activeNoteId = ref<string | null>(null);
const searchQuery = ref('');
const isLoading = ref(false);

const toggleNote = (user: AdminUser) => {
    activeNoteId.value = activeNoteId.value === user._id ? null : user._id;
};

const saveNote = async (user: AdminUser) => {
    try {
        await api.patch(`/admin/users/${user._id}/note`, {
            note: user.note
        }, {
            headers: { 'x-user-id': authState.user?.id }
        });
        addNotify('success', `Заметка для ${user.username} сохранена`);
        activeNoteId.value = null;
    } catch (e: any) {
        addNotify('error', e.response?.data?.message || 'Ошибка 404: Роут не найден');
    }
};

const toggleBan = async (user: AdminUser) => {
    try {
        const res = await api.patch(`/admin/users/${user._id}/ban`, {}, {
            headers: { 'x-user-id': authState.user?.id }
        });

        user.isBanned = res.data.isBanned;
        addNotify(user.isBanned ? 'error' : 'success',
            user.isBanned ? 'Пользователь забанен' : 'Доступ восстановлен');

        // await logEvent(user.isBanned ? 'warning' : 'info', 
        //   `${user.isBanned ? 'БАН' : 'РАЗБАН'}: ${user.username}`);
    } catch (e) {
        addNotify('error', 'Не удалось изменить статус блокировки');
    }
};

const toggleMute = async (user: AdminUser) => {
    try {
        const res = await api.patch(`/admin/users/${user._id}/mute`, {}, {
            headers: { 'x-user-id': authState.user?.id }
        });

        user.isMuted = res.data.isMuted;

        addNotify(
            user.isMuted ? 'warning' : 'success',
            user.isMuted ? `Пользователь ${user.username} замучен` : `Мут с ${user.username} снят`
        );
    } catch (e: any) {
        addNotify('error', e.response?.data?.message || 'Не удалось изменить статус мута');
    }
};

const fetchUsers = async () => {
    isLoading.value = true;
    try {
        const res = await api.get('/admin/users', {
            params: { search: searchQuery.value },
            headers: { 'x-user-id': authState.user?.id }
        });
        users.value = res.data;
    } catch (e) {
        addNotify('error', 'Ошибка загрузки пользователей');
    } finally {
        isLoading.value = false;
    }
};

const deleteUser = async (id: string) => {
    if (!confirm('Ты уверен, что хочешь безвозвратно удалить этот аккаунт?')) return;

    try {
        await api.delete(`/admin/users/${id}`, {
            headers: { 'x-user-id': authState.user?.id }
        });
        addNotify('success', 'Пользователь успешно удален');
        users.value = users.value.filter(u => u._id !== id);
    } catch (e: any) {
        addNotify('error', e.response?.data?.message || 'Ошибка при удалении');
    }
};

onMounted(fetchUsers);
</script>

<style scoped>
.user-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: var(--bg-accent);
    padding: 15px;
    border-radius: var(--radius-main);
    margin-bottom: 10px;
    border: 1px solid var(--glass-border);
}

.user-main-info {
    display: flex;
    align-items: center;
    gap: 15px;
    width: 30%;
}

.user-avatar {
    width: 45px;
    height: 45px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid var(--accent-blue);
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: var(--accent-blue);
    color: white;
}

.search-bar {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 30%;
    background: var(--input-bg);
    padding: 10px 10px;
    margin: 0 0 20px 20px;
    border-radius: var(--radius-sm);
    border: 1px solid transparent;
    transition: 0.3s;
}

.search-bar:focus-within {
    border-color: var(--accent-blue);
}

.search-bar i {
    color: var(--accent-blue);
    opacity: 0.7;
}

.search-bar input {
    background: none;
    border: none;
    outline: none;
    color: var(--text-main);
    width: 100%;
}

.user-details {
    display: flex;
    flex-direction: column;
}

.username {
    font-weight: bold;
    color: var(--text-main);
}

.username:hover {
    color: var(--accent-blue);
    transition: 250ms cubic-bezier(0.075, 0.82, 0.165, 1);
}

.email {
    font-size: 0.85rem;
    color: var(--text-muted);
}

.origin-tag {
    font-family: monospace;
    font-size: 0.8rem;
    background: rgba(0, 0, 0, 0.1);
    padding: 2px 6px;
    border-radius: 4px;
}

.action-buttons {
    display: flex;
    gap: 8px;
}

.action-buttons button,
.note-btn {
    background: var(--glass-bg);
    border: none;
    color: var(--text-main);
    padding: 8px;
    border-radius: 6px;
    cursor: pointer;
    transition: 0.2s;
}

.btn-delete:hover {
    background: var(--color-danger);
    color: white;
}

.has-note {
    color: var(--color-danger) !important;
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0% {
        transform: scale(1);
    }

    50% {
        transform: scale(1.1);
    }

    100% {
        transform: scale(1);
    }
}
</style>