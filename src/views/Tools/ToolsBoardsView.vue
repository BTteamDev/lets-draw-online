<template>
    <div class="tools-boards-preview">
        <div class="header-section">
            <h2>Галерея досок</h2>
            <button class="create-btn">+ Создать новую</button>
        </div>

        <div class="boards-grid">
            <!--  <BoardCard 
        v-for="board in mockBoards" 
        :key="board.id" 
        :board="board" 
      /> -->
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import BoardCard from '@/components/boards/BoardCard.vue';
import type { BoardPreview } from '@/ts/utils/interfaces';

//const mockBoards = ref<BoardPreview[]>([
//  {
//    id: 'b1',
//    title: 'Облачные Мечты ☁️',
//    previewUrl: 'https://picsum.photos/seed/board1/400/300',
//    usersCount: 12,
//    likes: 45,
//    authorName: 'CloudMaster',
//    createdAt: new Date().toISOString(),
//    isPrivate: false
//  },
//  {
//    id: 'b2',
//    title: 'Кибер-панк Рисунки',
//    previewUrl: 'https://picsum.photos/seed/board2/400/300',
//    usersCount: 5,
//    likes: 120,
//    authorName: 'NeonArtist',
//    createdAt: new Date().toISOString(),
//    isPrivate: false
//  },
//  {
//    id: 'b3',
//    title: 'Уроки Анатомии',
//    previewUrl: 'https://picsum.photos/seed/board3/400/300',
//    usersCount: 2,
//    likes: 8,
//    authorName: 'StudyHard',
//    createdAt: new Date().toISOString(),
//    isPrivate: false
//  },
//  {
//    id: 'b4',
//    title: 'Приватная Комната',
//    previewUrl: 'https://picsum.photos/seed/board4/400/300',
//    usersCount: 1,
//    likes: 0,
//    authorName: 'SecretUser',
//    createdAt: new Date().toISOString(),
//    isPrivate: true
//  }
//]);
</script>

<style scoped>
.tools-boards-preview {
    padding: 20px;
}

.header-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
}

.boards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 25px;
}

.create-btn {
    background: var(--color-viewer);
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: var(--radius-main);
    cursor: pointer;
    font-weight: bold;
}
</style>