<template>
    <div class="admin-user-details-template-wrapper">
        <div class="admin-details-page">
            <aside class="user-sidebar card">
                <div class="info-group">
                    <div class="avatar-container">
                        <img v-if="user.avatarUrl" :src="user.avatarUrl" alt="Avatar" class="profile-avatar">
                        <div class="profile-avatar" v-if="!user.avatarUrl">{{ user.username?.[0]?.toUpperCase() || '?'
                            }}
                        </div>
                    </div>
                    <div class="avatar-actions">
                        <button @click="deleteAvatar" class="btn-danger-outline">Удалить аватар</button>
                        <button @click="toggleAvatarLock" :class="user.isAvatarLocked ? 'btn-warn' : 'btn-secondary'">
                            {{ user.isAvatarLocked ? 'Разблокировать смену' : 'Запретить смену' }}
                        </button>
                    </div>
                    <h2>{{ user.username }} <span class="user-id">UID: {{ user._id }}</span></h2>
                    <p class="email">{{ user.email }}</p>
                </div>

                <div class="control-panel">
                    <div class="roles-container">
                        <h3>Роли системы</h3>
                        <div class="role-buttons">
                            <button v-for="role in availableRoles" :key="role" @click="toggleRole(role)"
                                :class="['role-btn', role, { 'active': user.role === role }]">
                                {{ role }}
                            </button>
                        </div>
                    </div>

                    <h3>Действия</h3>
                    <div class="action-grid">
                        <button @click="toggleBan" :class="{ 'active': user.isBanned }">Бан</button>
                        <button @click="toggleMute" :class="{ 'active': user.isMuted }">Мут</button>
                        <button :class="{ 'active': user.isShadowBanned }">Shadow</button>
                    </div>

                    <button @click="sendAlert" class="btn-alert">Отправить уведомление</button>
                </div>

                <div class="note-section">
                    <h3>Заметка админа</h3>
                    <textarea v-model="user.note" @blur="saveNote(user)" placeholder="Особые приметы..."></textarea>
                </div>
            </aside>

            <main class="boards-content">
                <div class="header">
                    <h2>Доски пользователя ({{ boards.length }})</h2>
                </div>

                <div class="boards-grid">
                    <div v-for="board in boards" :key="board._id" class="board-card card">
                        <img :src="board.preview || '/no-preview.png'" class="board-preview">
                        <div class="board-info">
                            <h4>{{ board.title }}</h4>
                            <span :class="['status', board.isPublic ? 'pub' : 'priv']">
                                {{ board.isPublic ? 'Публичная' : 'Приватная' }}
                            </span>
                        </div>
                        <div class="board-actions">
                            <button @click="deleteBoard(board._id)" class="btn-icon"><i
                                    class="fa-solid fa-trash"></i></button>
                            <button @click="toggleBoardStatus(board)" class="btn-icon"><i
                                    class="fa-solid fa-eye-slash"></i></button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
        <NotificationList />
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api } from '@/ts/utils/api';
import { useNotifications } from '@/ts/utils/notifications';
import { authState } from '@/ts/store/auth';
import NotificationList from '@/components/notification/NotificationList.vue';
import type { AdminUser } from '@/ts/utils/interfaces'

const route = useRoute();
const router = useRouter();
const { addNotify } = useNotifications();

const userId = route.params.id as string;
const user = ref<any>({ roles: [] });
const boards = ref<any[]>([]);
const isLoading = ref(true);
const activeNoteId = ref<string | null>(null);

const fetchUserDetails = async () => {
    try {
        const res = await api.get(`/admin/users/${userId}/details`,
            { headers: { 'x-user-id': authState.user?.id } }
        );
        user.value = res.data.user;
        boards.value = res.data.boards;
    } catch (e) {
        addNotify('error', 'Не удалось загрузить данные пользователя');
        router.push('/admin/users');
    } finally {
        isLoading.value = false;
    }
};

const toggleBan = async () => {
    const res = await api.patch(`/admin/users/${userId}/ban`, {},
        { headers: { 'x-user-id': authState.user?.id } }
    );
    user.value.isBanned = res.data.isBanned;
    addNotify(user.value.isBanned ? 'error' : 'success', 'Статус бана обновлен');
};

const toggleMute = async () => {
    const res = await api.patch(`/admin/users/${userId}/mute`, {},
        { headers: { 'x-user-id': authState.user?.id } }
    );
    user.value.isMuted = res.data.isMuted;
    addNotify('info', user.value.isMuted ? 'Мут выдан' : 'Мут снят');
};

const availableRoles = computed(() => {
    const allRoles = ['superadmin', 'admin', 'mod', 'dev', 'viewer'];
    const currentAdminRole = authState.user?.role;

    if (currentAdminRole === 'superadmin') {
        return allRoles.filter(r => r !== 'superadmin');
    }

    if (currentAdminRole === 'admin') {
        return allRoles.filter(r => r !== 'superadmin' && r !== 'admin');
    }

    return ['dev', 'mod', 'viewer'];
});

const isRoleActive = (roleName: string) => {
    return user.value.role === roleName;
};

const isRoleDisabled = (role: string) => {
    const adminRole = authState.user?.role;
    if (adminRole === 'admin' && (role === 'admin' || role === 'superadmin')) return true;
    return false;
};

const toggleRole = async (targetRole: string) => {
    try {
        const newRole = user.value.role === targetRole ? 'viewer' : targetRole;

        await api.patch(
            `/admin/users/${userId}/role`,
            { role: newRole },
            { headers: { 'x-user-id': authState.user?.id } }
        );

        user.value.role = newRole;
        addNotify('success', `Роль изменена на ${newRole}`);
    } catch (e) {
        addNotify('error', 'Не удалось обновить роль');
    }
};

const sendAlert = async () => {
    const message = prompt('Введите текст уведомления для пользователя:');
    if (!message) return;
    await api.post(`/admin/users/${userId}/alert`, { message }, { headers: { 'x-user-id': authState.user?.id } });
    addNotify('success', 'Уведомление отправлено');
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

const deleteAvatar = async () => {
    if (!confirm('Удалить аватар пользователя?')) return;
    await api.delete(`/admin/users/${userId}/avatar`,
        { headers: { 'x-user-id': authState.user?.id } }
    );
    user.value.avatarUrl = null;
    addNotify('warning', 'Аватар удален');
};

const toggleAvatarLock = async () => {
    const res = await api.patch(`/admin/users/${userId}/avatar-lock`,
        { headers: { 'x-user-id': authState.user?.id } }
    );
    user.value.isAvatarLocked = res.data.isAvatarLocked;
    addNotify('info', user.value.isAvatarLocked ? 'Смена аватара запрещена' : 'Смена аватара разрешена');
};

const toggleBoardStatus = async (board: any) => {
    try {
        const res = await api.patch(`/admin/boards/${board._id}/status`, {
            isPublic: !board.isPublic
        });

        board.isPublic = res.data.isPublic;

        addNotify(
            board.isPublic ? 'success' : 'warning',
            `Доска теперь ${board.isPublic ? 'публичная' : 'скрыта'}`
        );
    } catch (e) {
        addNotify('error', 'Не удалось изменить статус доски');
    }
};

const deleteBoard = async (boardId: string) => {
    if (!confirm('Вы уверены, что хотите безвозвратно удалить эту доску?')) return;
    await api.delete(`/admin/boards/${boardId}`);
    boards.value = boards.value.filter(b => b._id !== boardId);
    addNotify('error', 'Доска удалена');
};

onMounted(fetchUserDetails);
</script>

<style scoped>
.admin-details-page {
    display: grid;
    grid-template-columns: 380px 1fr;
    gap: 24px;
    padding: 24px;
    background: var(--bg-main);
    color: var(--text-main);
    min-height: 100vh;
}

.user-sidebar {
    background: var(--card-bg);
    border-radius: var(--radius-main);
    padding: 25px;
    box-shadow: var(--card-shadow);
    border: 1px solid var(--glass-border);
    height: fit-content;
}

.info-group,
.info-group h2 {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
}

.user-id {
    font-size: 20px;
}

.avatar-container {
    position: relative;
    width: 120px;
    height: 120px;
    border-radius: 50%;
    overflow: hidden;
    border: 4px solid var(--input-bg);
}

.profile-avatar {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: var(--accent-blue);
    color: white;
    font-size: 2.3rem;
}

.avatar-actions {
    display: flex;
    gap: 8px;
    justify-content: center;
}

.btn-danger-outline {
    padding: 8px 12px;
    background: transparent;
    border: 1px solid var(--color-danger);
    color: var(--color-danger);
    border-radius: var(--radius-sm);
    cursor: pointer;
    font-size: 0.8rem;
}

.role-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.role-btn {
    padding: 6px 12px;
    border: 1px solid var(--glass-border);
    background: var(--input-bg);
    color: var(--text-muted);
    border-radius: var(--radius-sm);
    cursor: pointer;
    font-size: 0.85rem;
    transition: var(--btn-transition);
    display: flex;
    align-items: center;
    gap: 6px;
    text-transform: capitalize;
}

.role-btn:hover {
    border-color: var(--accent-blue);
}

.btn-alert {
    padding: 10px;
    margin-top: 10px;
    border-radius: var(--radius-sm);
    border: none;
    background: var(--input-bg);
    color: var(--text-main);
    cursor: pointer;
    transition: var(--btn-transition);
}

.role-btn.active.admin {
    background: var(--color-admin);
    color: #fff;
}

.role-btn.active.mod {
    background: var(--color-mod);
    color: #fff;
}

.role-btn.active.dev {
    background: var(--color-dev);
    color: #fff;
}

.role-btn.active.editor {
    background: var(--color-editor);
    color: #fff;
}

.role-btn.active.viewer {
    background: var(--color-viewer);
    color: #fff;
}

.role-btn.active.superadmin {
    background: var(--accent-purple);
    color: #fff;
}

.action-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
}

.action-grid button {
    padding: 10px;
    border-radius: var(--radius-sm);
    border: none;
    background: var(--input-bg);
    color: var(--text-main);
    cursor: pointer;
    transition: var(--btn-transition);
}

.action-grid button.active {
    background: var(--color-danger);
    color: #fff;
}

.note-section textarea {
    width: 100%;
    min-height: 120px;
    background: var(--input-bg);
    border: 1px solid var(--glass-border);
    color: var(--text-main);
    border-radius: var(--radius-sm);
    padding: 10px;
    margin-top: 10px;
}
</style>