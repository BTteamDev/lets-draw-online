<template>
    <div class="profile-layout-wrapper">
        <div class="profile-page">
            <div class="container">
                <header class="profile-header">
                    <h1><i class="fa-solid fa-id-card"></i> Детали аккаунта</h1>
                </header>

                <div class="profile-grid">
                    <aside class="settings-card">
                        <div class="avatar-upload-section">
                            <div class="avatar-container">
                                <img v-if="user.avatarUrl" :src="user.avatarUrl" alt="Avatar" class="profile-avatar">
                                <div class="profile-avatar" v-if="!user.avatarUrl">{{ user.username[0]?.toUpperCase() }}
                                </div>
                                <label class="upload-overlay" for="avatar-input">
                                    <i class="fa-solid fa-camera"></i>
                                </label>
                                <input type="file" id="avatar-input" hidden @change="handleAvatarUpload"
                                    accept="image/*">
                            </div>
                            <p class="upload-hint">Нажмите, чтобы изменить фото</p>
                        </div>

                        <div class="form-group">
                            <label>ID Аккаунта</label>
                            <div class="input-wrapper disabled">
                                <i class="fa-solid fa-fingerprint"></i>
                                <input type="text" :value="user.id" disabled>
                            </div>
                        </div>

                        <div class="form-group">
                            <label>Имя пользователя</label>
                            <div class="input-wrapper">
                                <i class="fa-solid fa-user-pen"></i>
                                <input type="text" v-model="tempUsername" placeholder="Ваш никнейм">
                            </div>
                        </div>

                        <div class="form-group">
                            <label>Email адрес</label>
                            <div class="input-wrapper disabled">
                                <i class="fa-solid fa-envelope"></i>
                                <input type="email" :value="user.email" disabled>
                            </div>
                        </div>

                        <button class="save-btn" @click="saveChanges"
                            :disabled="isSaving || tempUsername === user.username">
                            <i class="fa-solid" :class="isSaving ? 'fa-spinner fa-spin' : 'fa-floppy-disk'"></i>
                            Сохранить изменения
                        </button>
                    </aside>

                    <main class="boards-management">
                        <div class="boards-card">
                            <div class="boards-header">
                                <h2><i class="fa-solid fa-table-columns"></i> Мои доски</h2>
                                <div class="tabs">
                                    <button :class="{ active: activeTab === 'public' }" @click="activeTab = 'public'">
                                        Публичные
                                    </button>
                                    <button :class="{ active: activeTab === 'private' }" @click="activeTab = 'private'">
                                        Приватные
                                    </button>
                                </div>
                            </div>

                            <div class="boards-list">
                                <div v-if="filteredBoards.length === 0" class="empty-boards">
                                    <i class="fa-solid fa-folder-open"></i>
                                    <p>У вас пока нет таких досок</p>
                                </div>

                                <div v-for="board in filteredBoards" :key="board._id" class="board-item">
                                    <div class="board-info">
                                        <span class="board-name">{{ board.title }}</span>
                                        <span class="board-date">{{ formatDate(board.createdAt) }}</span>
                                    </div>
                                    <div class="board-actions">
                                        <button @click="renameBoard(board)" class="action-btn rename"
                                            title="Переименовать">
                                            <i class="fa-solid fa-i-cursor"></i>
                                        </button>
                                        <button @click="deleteBoard(board._id)" class="action-btn delete"
                                            title="Удалить">
                                            <i class="fa-solid fa-trash-can"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </div>
        <NotificationList />
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { authState } from '@/ts/store/auth';
import { boardAPI, userAPI } from '@/ts/utils/api';
import { useNotifications } from '@/ts/utils/notifications';
import { ErrorRegistry, SuccessRegistry } from '@/ts/utils/messages';
import { api } from '@/ts/utils/api';
import NotificationList from '@/components/notification/NotificationList.vue';
import { updateUsernameInStore } from '@/ts/store/auth';

const { addNotify } = useNotifications();

const user = computed(() => {
    const u = authState.user;
    return {
        id: u?._id || u?.id || '',
        username: u?.username || 'Загрузка...',
        email: u?.email || '',
        avatarUrl: u?.avatarUrl || ''
    };
});

const tempUsername = ref('');
const isSaving = ref(false);
const isLoadingBoards = ref(true);
const activeTab = ref<'public' | 'private'>('public');
const myBoards = ref<any[]>([]);

onMounted(async () => {
    if (user.value.id) {
        tempUsername.value = user.value.username;
        await fetchMyBoards();
    }
});

const handleAvatarUpload = async (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
        addNotify('error', ErrorRegistry.FILE_AVATAR_TOO_LARGE);
        return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
        const base64String = reader.result as string;

        try {
            await userAPI.updateProfile({
                userId: user.value.id,
                avatarUrl: base64String
            });

            if (authState.user) {
                authState.user.avatarUrl = base64String;
                localStorage.setItem('user', JSON.stringify(authState.user));
            }

            addNotify('success', SuccessRegistry.AVATAR_SUCCESS);
        } catch (err) {
            addNotify('error', ErrorRegistry.PHOTO_LOADING_FAILED);
        }
    };

    reader.readAsDataURL(file);
};

const fetchMyBoards = async () => {
    if (!user.value?.id) return;
    isLoadingBoards.value = true;
    try {
        const res = await boardAPI.getMyBoards(user.value.id);
        myBoards.value = res.data;
    } catch (e) {
        addNotify('error', ErrorRegistry.BOARD_LOADING_FAILED);
    } finally {
        isLoadingBoards.value = false;
    }
};

const filteredBoards = computed(() =>
    myBoards.value.filter(b => activeTab.value === 'public' ? !b.isPrivate : b.isPrivate)
);

const saveChanges = async () => {
    if (!tempUsername.value.trim()) return;

    if (!user.value?.id) {
        addNotify('error', ErrorRegistry.USER_ID_NOT_FOUND);
        return;
    }

    isSaving.value = true;
    try {
        await userAPI.updateProfile({
            userId: user.value.id,
            username: tempUsername.value
        });

        updateUsernameInStore(tempUsername.value);
        addNotify('success', SuccessRegistry.CHANGES_SUCCESS);
    } catch (e) {
        console.error('Profile Update Error:', e);
        addNotify('error', ErrorRegistry.SERVER_ERROR);
    } finally {
        isSaving.value = false;
    }
};

const renameBoard = async (board: any) => {
    const newName = prompt('Введите новое название:', board.title);

    if (!newName || newName.trim() === board.title) return;

    try {
        await boardAPI.update(board._id, {
            title: newName.trim(),
            userId: user.value.id
        });

        board.title = newName.trim();
        addNotify('success', SuccessRegistry.BOARD_RENAMED);
    } catch (e) {
        console.error(e);
        addNotify('error', ErrorRegistry.SERVER_ERROR);
    }
};

const deleteBoard = async (id: string) => {
    if (!confirm('Вы уверены? Это действие необратимо.')) return;

    try {
        await api.delete(`/boards/${id}`, {
            data: { userId: user.value.id }
        });

        myBoards.value = myBoards.value.filter(b => b._id !== id);
        addNotify('success', SuccessRegistry.DELETE_SUCCESS);
    } catch (e) {
        addNotify('error', ErrorRegistry.DELETE_BOARD_FAILED);
    }
};

const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
};

watch(() => authState.user, (newUser) => {
    if (newUser) {
        tempUsername.value = newUser.username;
        fetchMyBoards();
    }
}, { immediate: true });
</script>

<style scoped>
.profile-page {
    padding: 40px 20px;
    background: var(--bg-main);
    min-height: calc(100vh - 70px);
}

.container {
    max-width: 1100px;
    margin: 0 auto;
}

.profile-header {
    margin-bottom: 30px;
}

.profile-header h1 {
    display: flex;
    align-items: center;
    gap: 15px;
    font-size: 1.8rem;
    color: var(--text-main);
}

.profile-grid {
    display: grid;
    grid-template-columns: 350px 1fr;
    gap: 30px;
    align-items: start;
}

.settings-card,
.boards-card {
    background: var(--card-bg);
    border-radius: var(--radius-main);
    padding: 30px;
    border: 1px solid var(--glass-border);
    box-shadow: var(--card-shadow);
}

.avatar-upload-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 30px;
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

.upload-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.4);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: 0.3s;
    cursor: pointer;
    font-size: 1.5rem;
}

.avatar-container:hover .upload-overlay {
    opacity: 1;
}

.upload-hint {
    font-size: 0.8rem;
    color: var(--text-muted);
    margin-top: 10px;
}

.form-group {
    margin-bottom: 20px;
}

.form-group label {
    display: block;
    font-size: 0.85rem;
    font-weight: 700;
    margin-bottom: 8px;
    color: var(--text-muted);
}

.input-wrapper {
    display: flex;
    align-items: center;
    gap: 12px;
    background: var(--input-bg);
    padding: 12px 15px;
    border-radius: var(--radius-sm);
    border: 1px solid transparent;
    transition: 0.3s;
}

.input-wrapper:focus-within {
    border-color: var(--accent-blue);
}

.input-wrapper i {
    color: var(--accent-blue);
    opacity: 0.7;
}

.input-wrapper input {
    background: none;
    border: none;
    outline: none;
    color: var(--text-main);
    width: 100%;
}

.input-wrapper.disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.save-btn {
    width: 100%;
    padding: 14px;
    background: var(--accent-blue);
    color: white;
    border: none;
    border-radius: var(--radius-sm);
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    transition: 0.3s;
}

.save-btn:disabled {
    filter: grayscale(1);
    cursor: default;
}

.save-btn:hover:not(:disabled) {
    background: var(--accent-purple);
    transform: translateY(-2px);
}

.boards-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 25px;
}

.boards-header h2 {
    font-size: 1.2rem;
    margin: 0;
    color: var(--text-main);
}

.tabs {
    display: flex;
    background: var(--input-bg);
    padding: 4px;
    border-radius: 8px;
}

.tabs button {
    padding: 6px 15px;
    border: none;
    background: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-muted);
}

.tabs button.active {
    background: var(--card-bg);
    color: var(--accent-blue);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.boards-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.board-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px;
    background: var(--input-bg);
    border-radius: 10px;
    transition: 0.2s;
}

.empty-boards {
    color: var(--text-muted);
}

.board-item:hover {
    transform: scale(1.01);
    background: rgba(255, 255, 255, 0.05);
}

.board-name {
    display: block;
    font-weight: 700;
    color: var(--text-main);
}

.board-date {
    font-size: 0.75rem;
    color: var(--text-muted);
}

.board-actions {
    display: flex;
    gap: 8px;
}

.action-btn {
    width: 32px;
    height: 32px;
    border-radius: 6px;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: 0.2s;
}

.action-btn.rename {
    background: rgba(52, 152, 219, 0.1);
    color: var(--accent-blue);
}

.action-btn.delete {
    background: rgba(231, 76, 60, 0.1);
    color: var(--color-danger);
}

.action-btn:hover {
    transform: translateY(-2px);
    filter: brightness(1.1);
}

@media (max-width: 900px) {
    .profile-grid {
        grid-template-columns: 1fr;
    }
}
</style>