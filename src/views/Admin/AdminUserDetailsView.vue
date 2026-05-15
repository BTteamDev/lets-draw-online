<template>
    <div class="admin-user-details-template-wrapper">
        <div class="admin-details-page">

            <aside class="user-sidebar">
                <div class="profile-hero">
                    <div class="avatar-ring" :class="{ banned: user.isBanned, shadowed: user.isShadowed }">
                        <img v-if="user.avatarUrl" :src="user.avatarUrl" alt="Avatar" class="profile-avatar">
                        <div class="profile-avatar placeholder" v-else>
                            {{ user.username?.[0]?.toUpperCase() || '?' }}
                        </div>
                        <div v-if="user.isAvatarLocked" class="avatar-lock-badge" title="Смена аватара заблокирована">
                            <i class="fa-solid fa-lock"></i>
                        </div>
                    </div>

                    <div class="profile-meta">
                        <h2 class="profile-name">{{ user.username }}</h2>
                        <p class="profile-email">{{ user.email }}</p>
                        <div class="profile-uid">
                            <i class="fa-solid fa-fingerprint"></i>
                            <span>{{ user._id }}</span>
                        </div>
                    </div>

                    <div class="status-tags">
                        <span v-if="user.isBanned" class="status-tag danger">
                            <i class="fa-solid fa-ban"></i> Забанен
                        </span>
                        <span v-if="user.isMuted" class="status-tag warning">
                            <i class="fa-solid fa-microphone-slash"></i> Замучен
                        </span>
                        <span v-if="user.isShadowed" class="status-tag muted">
                            <i class="fa-solid fa-eye-slash"></i> Шедоубан
                        </span>
                        <span v-if="user.isAvatarLocked" class="status-tag info">
                            <i class="fa-solid fa-lock"></i> Аватар заблокирован
                        </span>
                        <span v-if="!user.isBanned && !user.isMuted && !user.isShadowed" class="status-tag success">
                            <i class="fa-solid fa-circle-check"></i> Активен
                        </span>
                    </div>
                </div>

                <div class="sidebar-divider"></div>

                <div class="section">
                    <h3 class="section-title"><i class="fa-solid fa-image"></i> Аватар</h3>
                    <div class="btn-row">
                        <button @click="deleteAvatar" class="action-btn danger-outline">
                            <i class="fa-solid fa-trash-can"></i> Удалить
                        </button>
                        <button @click="toggleAvatarLock"
                            :class="['action-btn', user.isAvatarLocked ? 'warn-solid' : 'secondary']">
                            <i :class="user.isAvatarLocked ? 'fa-solid fa-lock-open' : 'fa-solid fa-lock'"></i>
                            {{ user.isAvatarLocked ? 'Разблокировать' : 'Заблокировать' }}
                        </button>
                    </div>
                </div>

                <div class="sidebar-divider"></div>

                <div class="section">
                    <h3 class="section-title"><i class="fa-solid fa-shield-halved"></i> Роль в системе</h3>
                    <div class="role-buttons">
                        <button v-for="role in availableRoles" :key="role" @click="toggleRole(role)"
                            :class="['role-btn', role, { active: user.role === role }]">
                            {{ role }}
                        </button>
                    </div>
                </div>

                <div class="sidebar-divider"></div>

                <div class="section">
                    <h3 class="section-title"><i class="fa-solid fa-gavel"></i> Модерация</h3>
                    <div class="mod-grid">
                        <button @click="toggleBan" :class="['mod-btn', { active: user.isBanned }]">
                            <i class="fa-solid fa-ban"></i>
                            <span>{{ user.isBanned ? 'Разбанить' : 'Бан' }}</span>
                        </button>
                        <button @click="toggleMute" :class="['mod-btn', { active: user.isMuted }]">
                            <i class="fa-solid fa-microphone-slash"></i>
                            <span>{{ user.isMuted ? 'Размутить' : 'Мут' }}</span>
                        </button>
                        <button @click="toggleShadow" :class="['mod-btn shadow-btn', { active: user.isShadowed }]">
                            <i class="fa-solid fa-eye-slash"></i>
                            <span>Shadow</span>
                        </button>
                    </div>

                    <button @click="sendAlert" class="alert-btn">
                        <i class="fa-solid fa-bell"></i> Отправить уведомление
                    </button>
                </div>

                <div class="sidebar-divider"></div>

                <div class="section">
                    <h3 class="section-title"><i class="fa-solid fa-note-sticky"></i> Заметка</h3>
                    <textarea v-model="user.note" @blur="saveNote(user)"
                        placeholder="Особые приметы, история нарушений..." class="note-textarea"></textarea>
                    <p class="note-hint">Сохраняется автоматически при потере фокуса</p>
                </div>
            </aside>

            <main class="boards-content">
                <div class="boards-header">
                    <h2><i class="fa-solid fa-table-columns"></i> Доски пользователя</h2>
                    <span class="boards-count">{{ boards.length }} шт.</span>
                </div>

                <div v-if="boards.length === 0" class="empty-state">
                    <i class="fa-solid fa-folder-open"></i>
                    <p>У пользователя нет досок</p>
                </div>

                <div class="boards-grid" v-else>
                    <div v-for="board in boards" :key="board._id" class="board-card">
                        <div class="board-preview-wrapper">
                            <img v-if="board.previewUrl" :src="board.previewUrl" class="board-preview">
                            <div v-else class="board-preview-placeholder">
                                <i class="fa-solid fa-chalkboard"></i>
                                <span>Нет превью</span>
                            </div>
                            <span :class="['board-status-badge', board.isPrivate ? 'priv' : 'pub']">
                                <i :class="board.isPrivate ? 'fa-solid fa-lock' : 'fa-solid fa-globe'"></i>
                                {{ board.isPrivate ? 'Приватная' : 'Публичная' }}
                            </span>
                        </div>
                        <div class="board-body">
                            <h4 class="board-title">{{ board.title }}</h4>
                            <p class="board-date">
                                <i class="fa-regular fa-calendar"></i>
                                {{ formatDate(board.createdAt) }}
                            </p>
                            <div class="board-actions">
                                <button @click="toggleBoardStatus(board)" class="board-btn secondary"
                                    :title="board.isPrivate ? 'Сделать публичной' : 'Скрыть'">
                                    <i :class="board.isPrivate ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash'"></i>
                                    {{ board.isPrivate ? 'Открыть' : 'Скрыть' }}
                                </button>
                                <button @click="deleteBoard(board._id)" class="board-btn danger">
                                    <i class="fa-solid fa-trash"></i> Удалить
                                </button>
                            </div>
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
import { authState } from '@/ts/stores/auth';
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

const toggleShadow = async () => {
    const res = await api.patch(
        `/admin/users/${userId}/shadow`, {},
        { headers: { 'x-user-id': authState.user?.id } }
    );
    user.value.isShadowed = res.data.isShadowed;
    addNotify('info', user.value.isShadowed ? 'Шедоубан выдан' : 'Шедоубан снят');
};

const availableRoles = computed(() => {
    const allRoles = ['superadmin', 'admin', 'mod', 'dev', 'viewer'];
    const currentAdminRole = authState.user?.role;
    if (currentAdminRole === 'superadmin') return allRoles.filter(r => r !== 'superadmin');
    if (currentAdminRole === 'admin') return allRoles.filter(r => r !== 'superadmin' && r !== 'admin');
    return ['dev', 'mod', 'viewer'];
});

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
    try {
        await api.post(`/admin/users/${userId}/alert`, { message },
            { headers: { 'x-user-id': authState.user?.id } }
        );
        addNotify('success', 'Уведомление отправлено');
    } catch (e) {
        addNotify('error', 'Не удалось отправить уведомление');
    }
};

const saveNote = async (u: AdminUser) => {
    try {
        await api.patch(`/admin/users/${u._id}/note`,
            { note: u.note },
            { headers: { 'x-user-id': authState.user?.id } }
        );
        addNotify('success', `Заметка сохранена`);
    } catch (e: any) {
        addNotify('error', e.response?.data?.message || 'Ошибка сохранения заметки');
    }
};

const deleteAvatar = async () => {
    if (!confirm('Удалить аватар пользователя?')) return;
    try {
        await api.delete(`/admin/users/${userId}/avatar`,
            { headers: { 'x-user-id': authState.user?.id } }
        );
        user.value.avatarUrl = null;
        addNotify('warning', 'Аватар удален');
    } catch (e) {
        addNotify('error', 'Не удалось удалить аватар');
    }
};

const toggleAvatarLock = async () => {
    const res = await api.patch(
        `/admin/users/${userId}/avatar-lock`, {},
        { headers: { 'x-user-id': authState.user?.id } }
    );
    user.value.isAvatarLocked = res.data.isAvatarLocked;
    addNotify('info', user.value.isAvatarLocked ? 'Смена аватара запрещена' : 'Смена аватара разрешена');
};

const toggleBoardStatus = async (board: any) => {
    try {
        const res = await api.patch(
            `/admin/boards/${board._id}/status`,
            { isPublic: board.isPrivate },
            { headers: { 'x-user-id': authState.user?.id } }
        );
        board.isPrivate = !res.data.isPublic;
        addNotify(!board.isPrivate ? 'success' : 'warning',
            `Доска теперь ${!board.isPrivate ? 'публичная' : 'скрыта'}`);
    } catch (e) {
        addNotify('error', 'Не удалось изменить статус доски');
    }
};

const deleteBoard = async (boardId: string) => {
    if (!confirm('Вы уверены? Это действие необратимо.')) return;
    try {
        await api.delete(`/admin/boards/${boardId}`,
            { headers: { 'x-user-id': authState.user?.id } }
        );
        boards.value = boards.value.filter(b => b._id !== boardId);
        addNotify('warning', 'Доска удалена');
    } catch (e) {
        addNotify('error', 'Ошибка при удалении доски');
    }
};

const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('ru-RU', {
        day: 'numeric', month: 'long', year: 'numeric'
    });
};

onMounted(fetchUserDetails);
</script>

<style scoped>
.admin-details-page {
    display: grid;
    grid-template-columns: 340px 1fr;
    gap: 24px;
    padding: 24px;
    background: var(--bg-main);
    color: var(--text-main);
    min-height: 100vh;
    align-items: start;
}

.user-sidebar {
    background: var(--card-bg);
    border-radius: var(--radius-main);
    border: 1px solid var(--glass-border);
    box-shadow: var(--card-shadow);
    overflow: hidden;
    position: sticky;
    top: 90px;
}

.profile-hero {
    padding: 30px 24px 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    background: linear-gradient(160deg, var(--bg-accent) 0%, var(--card-bg) 100%);
}

.avatar-ring {
    position: relative;
    width: 100px;
    height: 100px;
    border-radius: 50%;
    padding: 3px;
    background: linear-gradient(135deg, var(--accent-blue), var(--accent-purple));
    transition: 0.3s;
}

.avatar-ring.banned {
    background: linear-gradient(135deg, var(--color-danger), #c0392b);
}

.avatar-ring.shadowed {
    background: linear-gradient(135deg, #636e72, #2d3436);
}

.profile-avatar {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--card-bg);
    font-size: 2rem;
    font-weight: 700;
    color: var(--accent-blue);
}

.avatar-lock-badge {
    position: absolute;
    bottom: 2px;
    right: 2px;
    width: 22px;
    height: 22px;
    background: var(--color-warning);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.6rem;
    color: white;
    border: 2px solid var(--card-bg);
}

.profile-meta {
    text-align: center;
}

.profile-name {
    font-size: 1.2rem;
    font-weight: 800;
    margin: 0 0 4px;
    color: var(--text-main);
}

.profile-email {
    font-size: 0.8rem;
    color: var(--text-muted);
    margin: 0 0 8px;
}

.profile-uid {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: var(--input-bg);
    padding: 3px 10px;
    border-radius: 20px;
    font-family: 'Courier New', monospace;
    font-size: 0.65rem;
    color: var(--text-muted);
    max-width: 260px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.status-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    justify-content: center;
}

.status-tag {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 10px;
    border-radius: 20px;
    font-size: 0.7rem;
    font-weight: 700;
}

.status-tag.danger {
    background: rgba(255, 71, 87, 0.15);
    color: var(--color-danger);
}

.status-tag.warning {
    background: rgba(255, 165, 2, 0.15);
    color: var(--color-warning);
}

.status-tag.muted {
    background: rgba(99, 110, 114, 0.15);
    color: var(--text-muted);
}

.status-tag.info {
    background: rgba(52, 152, 219, 0.15);
    color: var(--accent-blue);
}

.status-tag.success {
    background: rgba(46, 213, 115, 0.15);
    color: var(--color-online);
}

.sidebar-divider {
    height: 1px;
    background: var(--glass-border);
}

.section {
    padding: 18px 24px;
}

.section-title {
    font-size: 0.7rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-muted);
    margin: 0 0 12px;
    display: flex;
    align-items: center;
    gap: 7px;
}

.btn-row {
    display: flex;
    gap: 8px;
}

.action-btn {
    flex: 1;
    padding: 8px 10px;
    border-radius: var(--radius-sm);
    border: 1px solid transparent;
    cursor: pointer;
    font-size: 0.78rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    transition: var(--btn-transition);
}

.action-btn.danger-outline {
    background: transparent;
    border-color: var(--color-danger);
    color: var(--color-danger);
}

.action-btn.danger-outline:hover {
    background: var(--color-danger);
    color: white;
}

.action-btn.warn-solid {
    background: var(--color-warning);
    color: white;
    border-color: var(--color-warning);
}

.action-btn.warn-solid:hover {
    filter: brightness(1.1);
}

.action-btn.secondary {
    background: var(--input-bg);
    color: var(--text-main);
}

.action-btn.secondary:hover {
    background: var(--accent-blue);
    color: white;
}

.role-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}

.role-btn {
    padding: 5px 12px;
    border: 1px solid var(--glass-border);
    background: var(--input-bg);
    color: var(--text-muted);
    border-radius: 20px;
    cursor: pointer;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: capitalize;
    transition: var(--btn-transition);
}

.role-btn:hover {
    border-color: var(--accent-blue);
    color: var(--accent-blue);
}

.role-btn.active.admin {
    background: var(--color-admin);
    color: #fff;
    border-color: var(--color-admin);
}

.role-btn.active.mod {
    background: var(--color-mod);
    color: #fff;
    border-color: var(--color-mod);
}

.role-btn.active.dev {
    background: var(--color-dev);
    color: #fff;
    border-color: var(--color-dev);
}

.role-btn.active.viewer {
    background: var(--color-viewer);
    color: #fff;
    border-color: var(--color-viewer);
}

.role-btn.active.superadmin {
    background: var(--accent-purple);
    color: #fff;
    border-color: var(--accent-purple);
}

.mod-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin-bottom: 10px;
}

.mod-btn {
    padding: 10px 6px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--glass-border);
    background: var(--input-bg);
    color: var(--text-main);
    cursor: pointer;
    font-size: 0.75rem;
    font-weight: 700;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
    transition: var(--btn-transition);
}

.mod-btn i {
    font-size: 1rem;
}

.mod-btn:hover {
    border-color: var(--color-danger);
    color: var(--color-danger);
}

.mod-btn.active {
    background: var(--color-danger);
    color: white;
    border-color: var(--color-danger);
}

.mod-btn.shadow-btn.active {
    background: #636e72;
    border-color: #636e72;
}

.alert-btn {
    width: 100%;
    padding: 9px;
    border-radius: var(--radius-sm);
    border: 1px dashed var(--glass-border);
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
    font-size: 0.8rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    transition: var(--btn-transition);
}

.alert-btn:hover {
    border-color: var(--color-warning);
    color: var(--color-warning);
    background: rgba(255, 165, 2, 0.05);
}

.note-textarea {
    width: 100%;
    min-height: 100px;
    background: var(--input-bg);
    border: 1px solid var(--glass-border);
    color: var(--text-main);
    border-radius: var(--radius-sm);
    padding: 10px;
    font-size: 0.85rem;
    resize: vertical;
    transition: border-color 0.2s;
    box-sizing: border-box;
}

.note-textarea:focus {
    outline: none;
    border-color: var(--accent-blue);
}

.note-hint {
    font-size: 0.65rem;
    color: var(--text-muted);
    margin: 5px 0 0;
}

.boards-content {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.boards-header {
    display: flex;
    align-items: center;
    gap: 12px;
}

.boards-header h2 {
    font-size: 1.2rem;
    font-weight: 800;
    margin: 0;
    color: var(--text-main);
    display: flex;
    align-items: center;
    gap: 10px;
}

.boards-count {
    background: var(--input-bg);
    color: var(--text-muted);
    font-size: 0.75rem;
    font-weight: 700;
    padding: 3px 10px;
    border-radius: 20px;
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
    opacity: 0.4;
}

.empty-state p {
    font-size: 0.9rem;
}

.boards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 16px;
}

.board-card {
    background: var(--card-bg);
    border-radius: var(--radius-main);
    border: 1px solid var(--glass-border);
    box-shadow: var(--card-shadow);
    overflow: hidden;
    transition: var(--btn-transition);
}

.board-card:hover {
    transform: translateY(-3px);
    box-shadow: var(--card-shadow-hover);
}

.board-preview-wrapper {
    position: relative;
    height: 140px;
    overflow: hidden;
    background: var(--input-bg);
}

.board-preview {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.board-status-badge {
    position: absolute;
    top: 8px;
    right: 8px;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 8px;
    border-radius: 20px;
    font-size: 0.65rem;
    font-weight: 700;
    backdrop-filter: blur(8px);
}

.board-status-badge.pub {
    background: rgba(46, 213, 115, 0.2);
    color: var(--color-online);
    border: 1px solid rgba(46, 213, 115, 0.3);
}

.board-status-badge.priv {
    background: rgba(99, 110, 114, 0.2);
    color: var(--text-muted);
    border: 1px solid rgba(99, 110, 114, 0.3);
}

.board-body {
    padding: 14px;
}

.board-title {
    font-size: 0.95rem;
    font-weight: 700;
    margin: 0 0 4px;
    color: var(--text-main);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.board-date {
    font-size: 0.72rem;
    color: var(--text-muted);
    margin: 0 0 12px;
    display: flex;
    align-items: center;
    gap: 5px;
}

.board-actions {
    display: flex;
    gap: 8px;
}

.board-btn {
    flex: 1;
    padding: 7px;
    border-radius: var(--radius-sm);
    border: none;
    cursor: pointer;
    font-size: 0.75rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    transition: var(--btn-transition);
}

.board-btn.secondary {
    background: var(--input-bg);
    color: var(--text-main);
}

.board-btn.secondary:hover {
    background: var(--accent-blue);
    color: white;
}

.board-btn.danger {
    background: rgba(255, 71, 87, 0.1);
    color: var(--color-danger);
}

.board-btn.danger:hover {
    background: var(--color-danger);
    color: white;
}

.board-preview-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background: linear-gradient(135deg, var(--input-bg) 0%, var(--bg-accent) 100%);
    color: var(--text-muted);
}

.board-preview-placeholder i {
    font-size: 2rem;
    opacity: 0.4;
}

.board-preview-placeholder span {
    font-size: 0.7rem;
    font-weight: 600;
    opacity: 0.5;
    text-transform: uppercase;
    letter-spacing: 0.08em;
}

@media (max-width: 1024px) {
    .admin-details-page {
        grid-template-columns: 1fr;
    }

    .user-sidebar {
        position: static;
    }
}
</style>