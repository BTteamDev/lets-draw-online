<template>
    <div class="admin-users-template-wrapper">
        <div class="admin-users">

            <div class="admin-header">
                <div class="header-left">
                    <h2><i class="fa-solid fa-circle-user"></i> Пользователи</h2>
                    <span class="users-count">
                        <i v-if="isLoading" class="fa-solid fa-circle-notch fa-spin"></i>
                        <template v-else>{{ users.length }} найдено</template>
                    </span>
                </div>
                <div class="search-bar">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <input v-model="searchQuery" @input="fetchUsers" placeholder="Поиск... (@name=, @email=, @id=)" />
                    <button v-if="searchQuery" @click="clearSearch" class="search-clear">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
            </div>

            <div v-if="isLoading" class="skeleton-list">
                <div v-for="i in 5" :key="i" class="skeleton-card">
                    <div class="skeleton-avatar"></div>
                    <div class="skeleton-lines">
                        <div class="skeleton-line w60"></div>
                        <div class="skeleton-line w40"></div>
                    </div>
                </div>
            </div>

            <div v-else-if="users.length === 0" class="empty-state">
                <i class="fa-solid fa-user-slash"></i>
                <p>Пользователи не найдены</p>
            </div>

            <div v-else class="user-list">
                <div v-for="user in users" :key="user._id" class="user-card"
                    :class="{ 'is-banned': user.isBanned, 'is-shadowed': user.isShadowed }">

                    <div class="user-avatar-wrapper">
                        <img v-if="user.avatarUrl" :src="user.avatarUrl" class="user-avatar" />
                        <div v-else class="user-avatar placeholder">{{ user.username[0]?.toUpperCase() }}</div>
                        <div class="status-indicators">
                            <span v-if="user.isBanned" class="indicator banned" title="Забанен">
                                <i class="fa-solid fa-ban"></i>
                            </span>
                            <span v-else-if="user.isMuted" class="indicator muted" title="Замучен">
                                <i class="fa-solid fa-microphone-slash"></i>
                            </span>
                            <span v-else-if="user.isShadowed" class="indicator shadowed" title="Шедоубан">
                                <i class="fa-solid fa-eye-slash"></i>
                            </span>
                        </div>
                    </div>

                    <div class="user-main-info">
                        <div class="user-name-row">
                            <router-link :to="`/admin/users/${user._id}`" class="username">
                                {{ user.username }}
                            </router-link>
                            <span v-if="user.role !== 'viewer'" :class="['role-badge', user.role]">
                                {{ user.role }}
                            </span>
                        </div>
                        <span class="email">{{ user.email }}</span>
                    </div>

                    <div class="user-meta">
                        <span class="ip-tag" :title="`IP: ${user.lastIp || 'нет данных'}`">
                            <i class="fa-solid fa-network-wired"></i>
                            {{ user.lastIp === '::1' ? 'LOCAL' : (user.lastIp || 'UNKNOWN') }}
                        </span>
                    </div>

                    <div class="user-actions">
                        <div class="note-container">
                            <button @click="toggleNote(user)" class="action-btn note-btn"
                                :class="{ 'has-note': user.note }"
                                :title="user.note ? 'Есть заметка' : 'Добавить заметку'">
                                <i class="fa-solid fa-note-sticky"></i>
                            </button>
                            <Transition name="popover">
                                <div v-if="activeNoteId === user._id" class="note-edit-popover" @click.stop>
                                    <p class="popover-title">Заметка для {{ user.username }}</p>
                                    <textarea v-model="user.note" @blur="saveNote(user)"
                                        @keydown.enter.ctrl="saveNote(user)" placeholder="Особые приметы..."
                                        autofocus></textarea>
                                    <small>Ctrl+Enter или потеря фокуса — сохранить</small>
                                </div>
                            </Transition>
                        </div>

                        <div class="action-divider"></div>

                        <div class="mod-buttons">
                            <button class="action-btn" :class="{ active: user.isBanned, 'mod-danger': true }"
                                :title="user.isBanned ? 'Разбанить' : 'Забанить'" @click="toggleBan(user)">
                                <i class="fa-solid fa-ban"></i>
                            </button>
                            <button class="action-btn" :class="{ active: user.isMuted, 'mod-warning': true }"
                                :title="user.isMuted ? 'Размутить' : 'Замутить'" @click="toggleMute(user)">
                                <i class="fa-solid fa-microphone-slash"></i>
                            </button>
                            <button class="action-btn" :class="{ active: user.isShadowed, 'mod-shadow': true }"
                                title="Шедоубан" @click="toggleShadow(user)">
                                <i class="fa-solid fa-eye-slash"></i>
                            </button>
                            <button class="action-btn mod-delete" title="Удалить аккаунт" @click="deleteUser(user._id)">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <NotificationList />
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '@/ts/utils/api';
import { authState } from '@/ts/stores/auth';
import { useNotifications } from '@/ts/utils/notifications';
import NotificationList from '@/components/notification/NotificationList.vue';
import type { AdminUser } from '@/ts/utils/interfaces';

const { addNotify } = useNotifications();

const users = ref<AdminUser[]>([]);
const activeNoteId = ref<string | null>(null);
const searchQuery = ref('');
const isLoading = ref(false);

const clearSearch = () => {
    searchQuery.value = '';
    fetchUsers();
};

const toggleNote = (user: AdminUser) => {
    activeNoteId.value = activeNoteId.value === user._id ? null : user._id;
};

const saveNote = async (user: AdminUser) => {
    try {
        await api.patch(`/admin/users/${user._id}/note`,
            { note: user.note },
            { headers: { 'x-user-id': authState.user?.id } }
        );
        addNotify('success', `Заметка для ${user.username} сохранена`);
        activeNoteId.value = null;
    } catch (e: any) {
        addNotify('error', e.response?.data?.message || 'Ошибка сохранения заметки');
    }
};

const toggleBan = async (user: AdminUser) => {
    try {
        const res = await api.patch(`/admin/users/${user._id}/ban`, {},
            { headers: { 'x-user-id': authState.user?.id } }
        );
        user.isBanned = res.data.isBanned;
        addNotify(
            user.isBanned ? 'error' : 'success',
            user.isBanned ? `${user.username} забанен` : `Бан с ${user.username} снят`
        );
    } catch (e) {
        addNotify('error', 'Не удалось изменить статус бана');
    }
};

const toggleMute = async (user: AdminUser) => {
    try {
        const res = await api.patch(`/admin/users/${user._id}/mute`, {},
            { headers: { 'x-user-id': authState.user?.id } }
        );
        user.isMuted = res.data.isMuted;
        addNotify(
            user.isMuted ? 'warning' : 'success',
            user.isMuted ? `${user.username} замучен` : `Мут с ${user.username} снят`
        );
    } catch (e: any) {
        addNotify('error', e.response?.data?.message || 'Не удалось изменить статус мута');
    }
};

const toggleShadow = async (user: AdminUser) => {
    try {
        const res = await api.patch(`/admin/users/${user._id}/shadow`, {},
            { headers: { 'x-user-id': authState.user?.id } }
        );
        user.isShadowed = res.data.isShadowed;
        addNotify('info', user.isShadowed ? 'Шедоубан выдан' : 'Шедоубан снят');
    } catch (e) {
        addNotify('error', 'Ошибка при шедоубане');
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
    if (!confirm('Безвозвратно удалить аккаунт?')) return;
    try {
        await api.delete(`/admin/users/${id}`,
            { headers: { 'x-user-id': authState.user?.id } }
        );
        users.value = users.value.filter(u => u._id !== id);
        addNotify('success', 'Пользователь удалён');
    } catch (e: any) {
        addNotify('error', e.response?.data?.message || 'Ошибка при удалении');
    }
};

onMounted(fetchUsers);
</script>

<style scoped>
.admin-users {
    padding: 24px;
    max-width: 1100px;
    margin: 0 auto;
}

.admin-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
    gap: 16px;
    flex-wrap: wrap;
}

.header-left {
    display: flex;
    align-items: center;
    gap: 12px;
}

.header-left h2 {
    font-size: 1.4rem;
    font-weight: 800;
    margin: 0;
    color: var(--text-main);
    display: flex;
    align-items: center;
    gap: 10px;
}

.users-count {
    background: var(--input-bg);
    color: var(--text-muted);
    font-size: 0.75rem;
    font-weight: 700;
    padding: 4px 12px;
    border-radius: 20px;
}

.search-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: 1;
    max-width: 400px;
    background: var(--card-bg);
    padding: 10px 14px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--glass-border);
    transition: border-color 0.2s, box-shadow 0.2s;
}

.search-bar:focus-within {
    border-color: var(--accent-blue);
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.search-bar i {
    color: var(--accent-blue);
    opacity: 0.6;
    flex-shrink: 0;
}

.search-bar input {
    background: none;
    border: none;
    outline: none;
    color: var(--text-main);
    width: 100%;
    font-size: 0.9rem;
}

.search-clear {
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: 2px;
    display: flex;
    align-items: center;
    transition: color 0.15s;
    flex-shrink: 0;
}

.search-clear:hover {
    color: var(--color-danger);
}

.skeleton-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.skeleton-card {
    display: flex;
    align-items: center;
    gap: 14px;
    background: var(--card-bg);
    padding: 16px;
    border-radius: var(--radius-main);
    border: 1px solid var(--glass-border);
    animation: shimmer 1.4s infinite;
}

.skeleton-avatar {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: var(--input-bg);
    flex-shrink: 0;
}

.skeleton-lines {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
}

.skeleton-line {
    height: 12px;
    background: var(--input-bg);
    border-radius: 6px;
}

.skeleton-line.w60 {
    width: 60%;
}

.skeleton-line.w40 {
    width: 40%;
}

@keyframes shimmer {

    0%,
    100% {
        opacity: 1;
    }

    50% {
        opacity: 0.5;
    }
}

.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 60px 20px;
    color: var(--text-muted);
    background: var(--card-bg);
    border-radius: var(--radius-main);
    border: 1px dashed var(--glass-border);
}

.empty-state i {
    font-size: 2.5rem;
    opacity: 0.3;
}

.empty-state p {
    font-size: 0.9rem;
}

.user-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.user-card {
    display: flex;
    align-items: center;
    gap: 16px;
    background: var(--card-bg);
    padding: 14px 16px;
    border-radius: var(--radius-main);
    border: 1px solid var(--glass-border);
    transition: box-shadow 0.2s, border-color 0.2s;
    position: relative;
}

.user-card:hover {
    box-shadow: var(--card-shadow-hover);
    border-color: rgba(52, 152, 219, 0.2);
}

.user-card.is-banned {
    border-color: rgba(255, 71, 87, 0.25);
    background: color-mix(in srgb, var(--card-bg), rgba(255, 71, 87, 0.03) 100%);
}

.user-card.is-shadowed {
    border-color: rgba(99, 110, 114, 0.3);
    opacity: 0.85;
}

.user-avatar-wrapper {
    position: relative;
    flex-shrink: 0;
}

.user-avatar {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid var(--glass-border);
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--accent-blue);
    color: white;
    font-weight: 700;
    font-size: 1rem;
}

.status-indicators {
    position: absolute;
    bottom: -2px;
    right: -2px;
}

.indicator {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.55rem;
    border: 2px solid var(--card-bg);
}

.indicator.banned {
    background: var(--color-danger);
    color: white;
}

.indicator.muted {
    background: var(--color-warning);
    color: white;
}

.indicator.shadowed {
    background: #636e72;
    color: white;
}

.user-main-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 3px;
}

.user-name-row {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
}

.username {
    font-weight: 700;
    font-size: 0.95rem;
    color: var(--text-main);
    text-decoration: none;
    transition: color 0.15s;
}

.username:hover {
    color: var(--accent-blue);
}

.email {
    font-size: 0.78rem;
    color: var(--text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.role-badge {
    font-size: 0.62rem;
    font-weight: 800;
    text-transform: uppercase;
    padding: 2px 8px;
    border-radius: 20px;
    letter-spacing: 0.05em;
}

.role-badge.admin {
    background: rgba(235, 77, 75, 0.15);
    color: var(--color-admin);
}

.role-badge.mod {
    background: rgba(95, 47, 143, 0.15);
    color: var(--color-mod);
}

.role-badge.dev {
    background: rgba(189, 62, 145, 0.15);
    color: var(--color-dev);
}

.role-badge.superadmin {
    background: rgba(155, 89, 182, 0.15);
    color: var(--accent-purple);
}

.user-meta {
    flex-shrink: 0;
}

.ip-tag {
    font-family: 'Courier New', monospace;
    font-size: 0.72rem;
    background: var(--input-bg);
    color: var(--accent-blue);
    padding: 4px 10px;
    border-radius: var(--radius-sm);
    display: inline-flex;
    align-items: center;
    gap: 5px;
    white-space: nowrap;
}

.user-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
}

.action-divider {
    width: 1px;
    height: 24px;
    background: var(--glass-border);
}

.mod-buttons {
    display: flex;
    gap: 6px;
}

.action-btn {
    width: 34px;
    height: 34px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--input-bg);
    border: 1px solid transparent;
    border-radius: var(--radius-sm);
    color: var(--text-muted);
    cursor: pointer;
    font-size: 0.85rem;
    transition: all 0.15s ease;
}

.action-btn:hover {
    transform: translateY(-1px);
}

.note-btn:hover {
    color: var(--accent-blue);
    border-color: var(--accent-blue);
}

.note-btn.has-note {
    color: var(--color-warning);
    border-color: var(--color-warning);
    animation: pulse 2s infinite;
}

@keyframes pulse {

    0%,
    100% {
        transform: scale(1);
    }

    50% {
        transform: scale(1.08);
    }
}

.mod-danger:hover {
    background: rgba(255, 71, 87, 0.1);
    color: var(--color-danger);
    border-color: var(--color-danger);
}

.mod-warning:hover {
    background: rgba(255, 165, 2, 0.1);
    color: var(--color-warning);
    border-color: var(--color-warning);
}

.mod-shadow:hover {
    background: rgba(99, 110, 114, 0.1);
    color: #636e72;
    border-color: #636e72;
}

.mod-delete:hover {
    background: var(--color-danger);
    color: white;
}

.action-btn.active.mod-danger {
    background: var(--color-danger);
    color: white;
    border-color: var(--color-danger);
}

.action-btn.active.mod-warning {
    background: var(--color-warning);
    color: white;
    border-color: var(--color-warning);
}

.action-btn.active.mod-shadow {
    background: #636e72;
    color: white;
    border-color: #636e72;
}

.note-container {
    position: relative;
}

.note-edit-popover {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    width: 260px;
    background: var(--card-bg);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-main);
    box-shadow: var(--card-shadow-hover);
    padding: 12px;
    z-index: 200;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.popover-title {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--text-muted);
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.06em;
}

.note-edit-popover textarea {
    width: 100%;
    min-height: 80px;
    background: var(--input-bg);
    border: 1px solid var(--glass-border);
    color: var(--text-main);
    border-radius: var(--radius-sm);
    padding: 8px;
    font-size: 0.82rem;
    resize: vertical;
    box-sizing: border-box;
    transition: border-color 0.2s;
}

.note-edit-popover textarea:focus {
    outline: none;
    border-color: var(--accent-blue);
}

.note-edit-popover small {
    font-size: 0.65rem;
    color: var(--text-muted);
}

.popover-enter-active,
.popover-leave-active {
    transition: opacity 0.15s ease, transform 0.15s ease;
}

.popover-enter-from,
.popover-leave-to {
    opacity: 0;
    transform: translateY(-4px);
}
</style>