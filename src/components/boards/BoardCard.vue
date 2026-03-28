<template>
    <div class="board-card-template-wrapper">
        <div class="board-card">
            <div class="card-preview">
                <img v-if="board.previewUrl" :src="board.previewUrl" alt="Board Preview" />
                <div v-else class="preview-placeholder">
                    <i class="fa-solid fa-palette"></i>
                    <span>Drawing...</span>
                </div>

                <div v-if="board.usersCount !== undefined" class="users-badge" title="Участников онлайн">
                    <i class="fa-solid fa-users"></i> {{ board.usersCount }}
                </div>

                <button v-if="isOwner" @click.stop="deleteBoard" class="delete-card-btn" title="Удалить доску">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </div>

            <div class="card-content">
                <h3>{{ board.title }}</h3>

                <p class="author">
                    Автор:
                    <span>
                        <i class="fa-solid fa-user-nib"></i>
                        {{ board.creator?.username || 'Аноним' }}
                        <span v-if="['superadmin', 'admin', 'dev', 'mod'].includes(creatorRole)" class="verify-badge"
                            :class="creatorRole" :data-tooltip="getTooltipText(creatorRole)">
                            <i class="fa-solid fa-circle-check"></i>
                        </span>
                    </span>
                </p>

                <div class="card-footer">
                    <span class="date" :title="`Дата создания: ${new Date(board.createdAt).toLocaleDateString()}`">
                        <i class="fa-regular fa-calendar-days"></i> {{ new Date(board.createdAt).toLocaleDateString() }}
                    </span>

                    <div class="actions">
                        <button @click.stop="toggleLike" :class="{ 'liked': isLiked }"
                            :title="!isLiked ? 'Нравится' : 'Больше не нравится'" class="like-btn">
                            <i :class="isLiked ? 'fa-solid fa-heart' : 'fa-regular fa-heart'"></i>
                            {{ likesCount }}
                        </button>

                        <router-link :to="`/board/${board._id}`" class="join-btn">
                            Зайти <i class="fa-solid fa-arrow-right-to-bracket"></i>
                        </router-link>
                    </div>
                </div>
            </div>
        </div>
        <ConfirmModal ref="confirmModal" />
        <NotificationList />
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { BoardPreview } from '@/ts/utils/interfaces';
import { useNotifications } from '@/ts/utils/notifications';
import { api } from '@/ts/utils/api'
import { ErrorRegistry, InfoRegistry } from '@/ts/utils/messages';
import NotificationList from '../notification/NotificationList.vue';
import ConfirmModal from '../modal/ConfirmModal.vue';
import { getTooltipText } from '@/ts/utils/tooltipTextBadge';
import { authState } from '@/ts/store/auth';

const { addNotify } = useNotifications();

const confirmModal = ref<InstanceType<typeof ConfirmModal> | null>(null);
const props = defineProps<{ board: BoardPreview }>();

const savedUser = localStorage.getItem('user');
const currentUserId = savedUser ? JSON.parse(savedUser).id : null;

const likesCount = ref(props.board.likes?.length || 0);
const isLiked = ref(props.board.likes?.includes(currentUserId));
const isProcessing = ref(false);

const isOwner = computed(() => props.board?.creator?._id === currentUserId);

const creatorRole = computed(() => {
    return props.board.creator?.systemRole || (props.board.creator as any)?.role || 'viewer';
});

const emit = defineEmits(['delete']);

const deleteBoard = async () => {
    const confirmed = await confirmModal.value?.show({
        title: 'Удаление доски',
        message: 'Вы действительно хотите удалить эту доску?',
        confirmText: 'Удалить',
        type: 'danger',
        icon: 'fa-solid fa-image-portrait'
    });

    if (!confirmed) return;

    try {
        const savedUser = localStorage.getItem('user');
        const userId = savedUser ? JSON.parse(savedUser).id : null;

        await api.delete(`http://localhost:5000/api/boards/${props.board._id}`, {
            data: { userId }
        });

        addNotify('info', InfoRegistry.BOARD_DELETED, 0);
        emit('delete', props.board._id);
    } catch (err) {
        addNotify('error', ErrorRegistry.DELETE_BOARD_FAILED, 0);
    }
};

const toggleLike = async () => {
    if (!currentUserId || isProcessing.value) return;
    if (authState.user.isBanned) {
        addNotify('error', 'Вы больше не залогинены, перезайдите в систему');
        return;
    }

    isProcessing.value = true;

    isLiked.value = !isLiked.value;
    likesCount.value += isLiked.value ? 1 : -1;

    try {
        const res = await api.post(`http://localhost:5000/api/boards/${props.board._id}/toggle-like`, {
            userId: currentUserId
        });
        likesCount.value = res.data.likesCount;
        isLiked.value = res.data.isLiked;
    } catch (err) {
        isLiked.value = !isLiked.value;
        likesCount.value += isLiked.value ? 1 : -1;
        addNotify('error', ErrorRegistry.LIKE_ERROR, 0);
    } finally {
        isProcessing.value = false;
    }
};
</script>

<style scoped>
.board-card-template-wrapper {
    width: 100%;
    max-width: 350px;
    margin: 0 auto;
}

.board-card {
    background: var(--card-bg);
    border-radius: var(--radius-main);
    overflow: hidden;
    box-shadow: var(--card-shadow);
    transition: var(--btn-transition);
    display: flex;
    flex-direction: column;
    border: 1px solid var(--glass-border);
}

.board-card:hover {
    transform: translateY(-5px);
    box-shadow: var(--card-shadow-hover);
}

.card-preview {
    position: relative;
    height: 160px;
    background: var(--input-bg);
    overflow: hidden;
}

.card-preview img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.5s ease;
}

.board-card:hover .card-preview img {
    transform: scale(1.05);
}

.preview-placeholder {
    user-select: none;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-main);
    font-weight: 600;
    background: linear-gradient(135deg, var(--input-bg) 0%, #e2e8f0 100%);
    font-size: 0.9rem;
}

.card-content {
    padding: 16px;
    flex-grow: 1;
    display: flex;
    flex-direction: column;
}

h3 {
    margin: 0;
    font-size: 1.15rem;
    color: var(--text-main);
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.author {
    font-size: 0.85rem;
    color: var(--text-muted);
    margin: 6px 0 16px 0;
}

.author span {
    font-weight: 600;
    color: var(--accent-blue);
}

.verify-badge::after {
    content: attr(data-tooltip);
    position: absolute;
    bottom: 35%;
    left: 50%;
    transform: translateX(-50%) translateY(5px);
    padding: 5px 10px;
    background: #1a1a1a;
    color: #ffffff;
    font-size: 11px;
    font-weight: 600;
    border-radius: 6px;
    white-space: nowrap;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
    opacity: 0;
    pointer-events: none;
    transition: all 0.2s ease;
    z-index: 9999;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.verify-badge:hover::after {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
}

.card-footer {
    margin-top: auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 12px;
    border-top: 1px solid var(--input-bg);
}

.date {
    font-size: 0.75rem;
    color: var(--text-muted);
}

.actions {
    display: flex;
    gap: 8px;
    align-items: center;
}

.like-btn {
    background: var(--input-bg);
    border: none;
    padding: 6px 10px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-main);
    transition: var(--btn-transition);
    display: flex;
    align-items: center;
    gap: 4px;
}

.like-btn:hover {
    background: color-mix(in srgb, var(--input-bg) 50%, var(--color-danger) 10%);
    color: var(--color-danger);
}

.like-btn.liked {
    color: var(--color-danger);
    background: rgba(255, 71, 87, 0.1);
}

.join-btn {
    background: var(--accent-blue);
    color: white;
    text-decoration: none;
    padding: 6px 14px;
    border-radius: var(--radius-sm);
    font-size: 0.85rem;
    font-weight: 700;
    transition: var(--btn-transition);
}

.join-btn:hover {
    background: var(--accent-purple);
    box-shadow: 0 4px 8px rgba(155, 89, 182, 0.3);
}

.users-badge {
    position: absolute;
    top: 12px;
    left: 12px;
    background: var(--glass-bg);
    color: var(--text-main);
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 700;
    backdrop-filter: var(--glass-blur);
    border: 1px solid var(--glass-border);
    display: flex;
    align-items: center;
    gap: 4px;
    z-index: 2;
}

.delete-card-btn {
    position: absolute;
    top: 12px;
    right: 12px;
    background: rgba(255, 71, 87, 0.2);
    color: white;
    border: 1px solid rgba(255, 71, 87, 0.3);
    border-radius: 50%;
    width: 32px;
    height: 32px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: var(--glass-blur);
    transition: var(--btn-transition);
    z-index: 2;
}

.delete-card-btn:hover {
    background: var(--color-danger);
    transform: rotate(90deg) scale(1.1);
    box-shadow: 0 0 15px rgba(255, 71, 87, 0.4);
}

.preview-placeholder i {
    font-size: 2rem;
    margin-bottom: 8px;
    opacity: 0.5;
}

.preview-placeholder {
    flex-direction: column;
}

.users-badge i {
    font-size: 0.7rem;
    margin-right: 4px;
}

.author i {
    font-size: 0.8rem;
    margin-right: 4px;
    opacity: 0.7;
}

.date i {
    margin-right: 4px;
}

.like-btn i {
    transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.like-btn:hover i {
    transform: scale(1.2);
}

.like-btn.liked i {
    color: var(--color-danger);
    filter: drop-shadow(0 0 5px rgba(255, 71, 87, 0.4));
}

.join-btn i {
    margin-left: 6px;
    font-size: 0.8rem;
    transition: transform 0.2s ease;
}

.join-btn:hover i {
    transform: translateX(3px);
}

.delete-card-btn i {
    font-size: 0.9rem;
}

.liked i {
    animation: heartBeat 0.3s ease-in-out;
}

@keyframes heartBeat {
    0% {
        transform: scale(1);
    }

    50% {
        transform: scale(1.3);
    }

    100% {
        transform: scale(1.1);
    }
}

@media (max-width: 480px) {
    .board-card-template-wrapper {
        max-width: 420px;
        padding: 0 5px;
    }

    .card-preview {
        height: 140px;
    }

    .card-content {
        padding: 12px;
    }

    h3 {
        font-size: 1rem;
    }

    .author {
        margin-bottom: 10px;
    }

    .card-footer {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
    }

    .actions {
        width: 100%;
        justify-content: space-between;
    }

    .join-btn {
        flex: 1;
        text-align: center;
    }
}

@media (min-width: 768px) {
    .board-card-template-wrapper {
        max-width: 380px;
    }
}
</style>