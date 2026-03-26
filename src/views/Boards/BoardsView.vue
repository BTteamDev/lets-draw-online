<template>
    <div class="boards-template-wrapper">
        <div class="boards-page">
            <div class="container">
                <header class="boards-header">
                    <div class="header-text">
                        <h1><i class="fa-solid fa-layer-group"></i> Доски</h1>
                        <p v-if="!isLoading">Найдено: {{ filteredAndSortedBoards.length }}</p>
                    </div>

                    <button @click="showModal = true" class="create-btn">
                        <i class="fa-solid fa-plus"></i>
                        <span>Создать доску</span>
                    </button>
                </header>

                <div class="controls-panel">
                    <div class="tabs">
                        <button :class="{ active: activeTab === 'public' }" @click="activeTab = 'public'">
                            <i class="fa-solid fa-globe"></i> Публичные
                        </button>
                        <button v-if="authState.isLoggedIn" :class="{ active: activeTab === 'private' }"
                            @click="activeTab = 'private'">
                            <i class="fa-solid fa-lock"></i> Мои приватные
                        </button>
                    </div>

                    <div class="sort-wrapper">
                        <i class="fa-solid fa-arrow-down-wide-short"></i>
                        <select v-model="sortBy" class="sort-select">
                            <option value="new">Сначала новые</option>
                            <option value="old">Сначала старые</option>
                            <option value="abc">А — Я</option>
                            <option value="zyx">Я — А</option>
                            <option value="likes">По лайкам</option>
                            <option value="popular">Популярные</option>
                        </select>
                    </div>
                </div>

                <div v-if="isLoading" class="loading-state">
                    <i class="fa-solid fa-circle-notch fa-spin"></i>
                    <p>Загружаем холсты...</p>
                </div>

                <div v-else-if="filteredAndSortedBoards.length === 0" class="empty-state">
                    <i class="fa-solid fa-wind"></i>
                    <p v-if="activeTab === 'private'">У вас пока нет приватных досок</p>
                    <p v-else>Досок не найдено...</p>
                </div>

                <div v-else class="boards-grid">
                    <BoardCard v-for="board in filteredAndSortedBoards" :key="board._id" :board="board"
                        @delete="removeBoard" />
                </div>
            </div>

            <CreateBoardModal v-if="showModal" @close="showModal = false" @created="fetchBoards" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import CreateBoardModal from '@/components/boards/CreateBoardModal.vue';
import BoardCard from '@/components/boards/BoardCard.vue';
import type { BoardPreview } from '@/ts/utils/interfaces';
import { boardAPI } from '@/ts/utils/api';
import { socket } from '@/ts/utils/socket';
import { useNotifications } from '@/ts/utils/notifications';
import { ErrorRegistry, InfoRegistry } from '@/ts/utils/messages';
import NotificationList from '@/components/notification/NotificationList.vue';
import { authState } from '@/ts/store/auth';

const { addNotify } = useNotifications();

const boards = ref<BoardPreview[]>([]);
const showModal = ref(false);
const isLoading = ref(true)
const activeTab = ref<'public' | 'private'>('public');
const sortBy = ref('new');
const allBoards = ref<BoardPreview[]>([]);

const filteredAndSortedBoards = computed(() => {
    const currentUserId = authState.user?._id || authState.user?.id;

    let result = allBoards.value.filter(board => {
        if (activeTab.value === 'public') {
            return !board.isPrivate;
        } else {
            return board.isPrivate && board.creator === currentUserId;
        }
    });

    return result.sort((a, b) => {
        switch (sortBy.value) {
            case 'abc': return a.title.localeCompare(b.title);
            case 'zyx': return b.title.localeCompare(a.title);
            case 'likes': return (b.likes?.length || 0) - (a.likes?.length || 0);
            case 'new': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            case 'old': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            case 'popular': return (b.usersCount || 0) - (a.usersCount || 0);
            default: return 0;
        }
    });
});

const fetchBoards = async () => {
    isLoading.value = true;
    try {
        const [publicRes, privateRes] = await Promise.all([
            boardAPI.getPublic(),
            authState.user ? boardAPI.getMyBoards(authState.user._id || authState.user.id) : { data: [] }
        ]);

        const uniqueBoardsMap = new Map();

        privateRes.data.forEach((b: any) => uniqueBoardsMap.set(b._id, b));
        publicRes.data.forEach((b: any) => uniqueBoardsMap.set(b._id, b));

        allBoards.value = Array.from(uniqueBoardsMap.values());

        socket.on('global-users-update', (counts: Record<string, number>) => {
            allBoards.value.forEach(board => {
                board.usersCount = counts[board._id] || 0;
            });
        });
    } catch (e) {
        addNotify('error', ErrorRegistry.LOADING_ERROR);
    } finally {
        isLoading.value = false;
    }
};

const removeBoard = (deletedId: string) => {
    allBoards.value = allBoards.value.filter(b => b._id !== deletedId);
};

onMounted(fetchBoards);
</script>

<style scoped>
.boards-page {
    padding: 40px 20px;
    background: var(--bg-main);
    min-height: 100vh;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
}

.boards-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 40px;
    padding-bottom: 20px;
    border-bottom: 1px solid var(--glass-border);
}

.header-text h1 {
    font-size: 2.2rem;
    color: var(--text-main);
    margin: 0;
    display: flex;
    align-items: center;
    gap: 15px;
    font-weight: 800;
}

.header-text h1 i {
    color: var(--accent-blue);
}

.header-text p {
    color: var(--text-muted);
    margin: 5px 0 0 0;
    font-size: 1rem;
}

.create-btn {
    background: var(--accent-blue);
    color: white;
    border: none;
    padding: 14px 28px;
    border-radius: var(--radius-main);
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 10px;
    transition: var(--btn-transition);
    box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);
}

.create-btn:hover {
    background: var(--accent-purple);
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(155, 89, 182, 0.4);
}

.create-btn i {
    font-size: 1.1rem;
}

.boards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 30px;
    animation: fadeIn 0.5s ease;
}

.loading-state,
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 100px 0;
    color: var(--text-muted);
}

.loading-state i {
    font-size: 3rem;
    color: var(--accent-blue);
    margin-bottom: 20px;
}

.empty-state i {
    font-size: 4rem;
    margin-bottom: 20px;
    opacity: 0.3;
}

.empty-state .create-btn.secondary {
    margin-top: 20px;
    background: var(--input-bg);
    color: var(--text-main);
    box-shadow: none;
}

.controls-panel {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
    gap: 20px;
}

.tabs {
    display: flex;
    background: var(--input-bg);
    padding: 5px;
    border-radius: 12px;
    border: 1px solid var(--glass-border);
}

.tabs button {
    padding: 10px 20px;
    border: none;
    background: none;
    color: var(--text-muted);
    font-weight: 600;
    cursor: pointer;
    border-radius: 8px;
    transition: 0.3s;
    display: flex;
    align-items: center;
    gap: 8px;
}

.tabs button.active {
    background: var(--card-bg);
    color: var(--accent-blue);
    box-shadow: var(--card-shadow);
}

.sort-wrapper {
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--text-main);
    background: var(--input-bg);
    padding: 0 15px;
    border-radius: 12px;
    border: 1px solid var(--glass-border);
}

.sort-select {
    background: none;
    border: none;
    color: var(--text-main);
    padding: 12px 0;
    font-weight: 600;
    outline: none;
    cursor: pointer;
}

@media (max-width: 768px) {
    .controls-panel {
        flex-direction: column;
        align-items: stretch;
    }
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@media (max-width: 600px) {
    .boards-header {
        flex-direction: column;
        text-align: center;
        gap: 20px;
    }

    .create-btn {
        width: 100%;
        justify-content: center;
    }
}
</style>