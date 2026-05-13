<template>
    <div class="boards-template-wrapper">
        <div class="boards-page">
            <div class="container">
                <header class="boards-header">
                    <div class="header-text">
                        <h1><i class="fa-solid fa-layer-group"></i> Доски</h1>
                        <p v-if="!isLoading">Найдено досок: <b>{{ filteredAndSortedBoards.length }}</b></p>
                    </div>

                    <button @click="showModal = true" class="create-btn">
                        <i class="fa-solid fa-plus"></i>
                        <span>Создать доску</span>
                    </button>
                </header>

                <div class="controls-panel">
                    <div class="tabs">
                        <button :class="{ active: activeTab === 'public' }" @click="activeTab = 'public'">
                            <i class="fa-solid fa-globe"></i>
                            <p>Публичные</p>
                        </button>
                        <button v-if="authState.isLoggedIn" :class="{ active: activeTab === 'private' }"
                            @click="activeTab = 'private'">
                            <i class="fa-solid fa-lock"></i>
                            <p>Мои приватные</p>
                        </button>
                        <button class="reload-btn" title="Перезагрузить список" @click="fetchBoards">
                            <i class="fa-solid fa-arrow-rotate-right"></i>
                            <p style="display: none;">Перезагрузить</p>
                        </button>
                    </div>

                    <div class="custom-select-container" v-click-outside="() => isSortOpen = false">
                        <div class="select-trigger" @click="isSortOpen = !isSortOpen" :class="{ 'active': isSortOpen }">
                            <i class="fa-solid fa-arrow-down-wide-short"></i>
                            <span class="selected-value">{{ currentSortLabel }}</span>
                            <i class="fa-solid fa-chevron-down arrow-icon" :class="{ 'rotated': isSortOpen }"></i>
                        </div>

                        <transition name="dropdown">
                            <div v-if="isSortOpen" class="options-dropdown">
                                <div v-for="option in sortOptions" :key="option.value" class="option-item"
                                    :class="{ 'selected': sortBy === option.value }"
                                    @click="handleSortChange(option.value)">
                                    <i :class="option.icon"></i>
                                    {{ option.label }}
                                    <i v-if="sortBy === option.value" class="fa-solid fa-check check-mark"></i>
                                </div>
                            </div>
                        </transition>
                    </div>
                </div>

                <div v-if="isLoading" class="loading-state">
                    <i class="fa-solid fa-spinner fa-spin"></i>
                    <p>Загружаем холсты...</p>
                </div>

                <div v-else-if="filteredAndSortedBoards.length === 0" class="empty-state">
                    <i class="fa-solid fa-wind"></i>
                    <p v-if="activeTab === 'private'">У вас пока нет приватных досок</p>
                    <p v-else>
                        {{ errorMessage ?
                            'Ошибка загрузки досок. Проверьте подключение к Интернету и перезагрузите страницу.'
                            : 'Досок не найдено...' }}
                    </p>
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
import { authState } from '@/ts/stores/auth';
import { getTooltipText } from '@/ts/utils/tooltipText';

const { addNotify } = useNotifications();

const boards = ref<BoardPreview[]>([]);
const showModal = ref(false);
const isLoading = ref(true)
const activeTab = ref<'public' | 'private'>('public');
const sortBy = ref('new');
const allBoards = ref<BoardPreview[]>([]);

const errorMessage = ref(false)

const isSortOpen = ref(false);
const sortOptions = [
    { value: 'new', label: 'Сначала новые', icon: 'fa-solid fa-calendar-plus' },
    { value: 'old', label: 'Сначала старые', icon: 'fa-solid fa-calendar-minus' },
    { value: 'abc', label: 'А — Я', icon: 'fa-solid fa-sort-alpha-down' },
    { value: 'zyx', label: 'Я — А', icon: 'fa-solid fa-sort-alpha-up' },
    { value: 'likes', label: 'По лайкам', icon: 'fa-solid fa-heart' },
    { value: 'popular', label: 'Популярные', icon: 'fa-solid fa-fire' }
];
const currentSortLabel = computed(() => {
    return sortOptions.find(opt => opt.value === sortBy.value)?.label || 'Сортировка';
});
const handleSortChange = (val: string) => {
    sortBy.value = val;
    isSortOpen.value = false;
};

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
        errorMessage.value = true;
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
    height: 40px;
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

.reload-btn:hover {
    color: var(--accent-blue);
    transform: rotate(360deg) scale(1.1);
}

.custom-select-container {
    position: relative;
    min-width: 200px;
    user-select: none;
}

.select-trigger {
    display: flex;
    align-items: center;
    gap: 12px;
    background: var(--input-bg);
    padding: 10px 18px;
    border-radius: 12px;
    border: 1px solid var(--glass-border);
    cursor: pointer;
    transition: all 0.3s ease;
    color: var(--text-main);
}

.select-trigger:hover,
.select-trigger.active {
    border-color: var(--accent-blue);
    background: var(--card-bg);
}

.selected-value {
    font-weight: 600;
    flex: 1;
    font-size: 0.95rem;
}

.arrow-icon {
    font-size: 0.8rem;
    opacity: 0.5;
    transition: transform 0.3s ease;
}

.arrow-icon.rotated {
    transform: rotate(180deg);
}

.options-dropdown {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    left: 0;
    background: var(--card-bg);
    border: 1px solid var(--glass-border);
    border-radius: 14px;
    overflow: hidden;
    z-index: 1000;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(10px);
}

.option-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 18px;
    cursor: pointer;
    color: var(--text-main);
    font-size: 0.9rem;
    transition: all 0.2s ease;
}

.option-item i:not(.check-mark) {
    width: 16px;
    color: var(--accent-blue);
    opacity: 0.7;
}

.option-item:hover {
    background: var(--input-bg);
    color: var(--text-main);
}

.option-item.selected {
    color: var(--accent-blue);
    background: rgba(52, 152, 219, 0.05);
}

.check-mark {
    margin-left: auto;
    font-size: 0.8rem;
}

.dropdown-enter-active,
.dropdown-leave-active {
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.dropdown-enter-from,
.dropdown-leave-to {
    opacity: 0;
    transform: translateY(-10px);
}

/*@media (max-width: 768px) {
    .controls-panel {
        flex-direction: column;
        align-items: stretch;
    }
}*/

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

@media (max-width: 768px) {
    .boards-page {
        padding: 20px 15px;
    }

    .header-text h1 {
        font-size: 1.8rem;
        justify-content: center;
    }

    .controls-panel {
        gap: 12px;
        margin-bottom: 20px;
        flex-direction: column;
    }

    .tabs {
        width: 100%;
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
    }

    .tabs button {
        justify-content: center;
        padding: 12px 5px;
        font-size: 0.9rem;
    }

    .tabs button p {
        display: none;
    }

    .sort-wrapper {
        width: 100%;
        justify-content: center;
    }

    .sort-select {
        flex: 1;
        text-align: center;
    }

    .boards-grid {
        grid-template-columns: 1fr;
        gap: 20px;
    }

    .custom-select-container {
        min-width: 100%;
    }
}

@media (max-width: 480px) {
    .header-text h1 {
        font-size: 1.5rem;
    }

    .header-text p {
        font-size: 0.9rem;
    }

    .create-btn {
        padding: 12px;
        font-size: 0.95rem;
    }
}
</style>