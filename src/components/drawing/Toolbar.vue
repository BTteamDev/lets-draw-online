<template>
    <div class="drawing-toolbar">
        <div class="tool-group">
            <button :class="{ active: tool === 'brush' }" @click="emit('update:tool', 'brush')" title="Кисть">
                <i class="fa-solid fa-paintbrush"></i>
            </button>
            <button :class="{ active: tool === 'eraser' }" @click="emit('update:tool', 'eraser')" title="Ластик">
                <i class="fa-solid fa-eraser"></i>
            </button>
            <button :class="{ active: tool === 'rect' }" @click="emit('update:tool', 'rect')" title="Прямоугольник">
                <i class="fa-regular fa-square"></i>
            </button>
            <button :class="{ active: tool === 'circle' }" @click="emit('update:tool', 'circle')" title="Круг">
                <i class="fa-regular fa-circle"></i>
            </button>
            <button :class="{ active: tool === 'line' }" @click="emit('update:tool', 'line')" title="Прямая линия">
                <i class="fa-solid fa-slash"></i>
            </button>
            <button :class="{ active: tool === 'picker' }" @click="emit('update:tool', 'picker')" title="Пипетка">
                <i class="fa-solid fa-eye-dropper"></i>
            </button>
        </div>

        <div class="divider"></div>

        <div class="tool-group settings">
            <div class="input-wrapper">
                <i class="fa-solid fa-palette icon-label"></i>
                <input type="color" :value="color" :disabled="tool === 'eraser'"
                    @input="e => emit('update:color', (e.target as HTMLInputElement).value)" />
            </div>

            <div class="slider-wrapper">
                <i class="fa-solid fa-circle-half-stroke icon-label"></i>
                <input type="range" min="0.1" max="1" step="0.1" :value="opacity"
                    @input="e => emit('update:opacity', Number((e.target as HTMLInputElement).value))" />
            </div>
        </div>

        <div class="divider"></div>

        <div class="tool-group settings">
            <div class="slider-wrapper">
                <span class="size-text">{{ width }}px</span>
                <input type="range" min="1" max="100" :value="width"
                    @input="e => emit('update:width', Number((e.target as HTMLInputElement).value))" />
            </div>
        </div>

        <div class="action-group">
            <button @click="emit('undo')" :disabled="!canUndo" title="Назад (Ctrl+Z)">
                <i class="fa-solid fa-rotate-left"></i>
            </button>
            <button @click="emit('redo')" :disabled="!canRedo" title="Вперед (Ctrl+Y)">
                <i class="fa-solid fa-rotate-right"></i>
            </button>

            <div class="divider"></div>

            <button @click="emit('clear')" title="Очистить всё" class="danger-btn">
                <i class="fa-solid fa-trash-can"></i>
            </button>
            <button @click="downloadImage" title="Скачать PNG">
                <i class="fa-solid fa-download"></i>
            </button>

            <button @click="emit('save')" :disabled="isSaving" class="save-btn">
                <i v-if="isSaving" class="fa-solid fa-cloud-arrow-up fa-bounce"></i>
                <i v-else class="fa-solid fa-cloud-arrow-up"></i>
                <span>{{ isSaving ? '...' : 'Сохранить' }}</span>
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { ToolType, UserProfile } from '@/ts/utils/interfaces';
import { computed, ref } from 'vue';

const props = defineProps<{
    color: string;
    width: number;
    tool: ToolType;
    opacity: number;
    isSaving?: boolean;
    canUndo: boolean;
    canRedo: boolean;
}>();

const emit = defineEmits(['update:color', 'update:width', 'update:tool', 'update:opacity', 'undo', 'redo', 'clear', 'save']);

const roomUsers = ref<UserProfile[]>([]);
const savedUser = localStorage.getItem('user');
const currentUser = savedUser ? JSON.parse(savedUser) : { username: 'Аноним', id: 'guest' };

const currentUserRole = computed(() => {
    const me = roomUsers.value.find(u => u.id === currentUser.id);
    return me?.roomRole || 'viewer';
});

const downloadImage = () => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
        const link = document.createElement('a');
        link.download = 'my-art.png';
        link.href = canvas.toDataURL();
        link.click();
    }
};
</script>


<style scoped>
.drawing-toolbar {
    display: flex;
    gap: 15px;
    padding: 10px 20px;
    background: var(--toolbar-bg);
    backdrop-filter: var(--glass-blur);
    border-radius: var(--radius-main);
    box-shadow: var(--card-shadow);
    border: 1px solid var(--glass-border);
    align-items: center;
    margin-bottom: 20px;
    width: fit-content;
    user-select: none;
}

.tool-group,
.action-group {
    display: flex;
    gap: 8px;
    align-items: center;
}

button {
    width: 38px;
    height: 38px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--input-bg);
    border: none;
    border-radius: var(--radius-sm);
    color: var(--text-main);
    cursor: pointer;
    transition: var(--btn-transition);
    font-size: 1.1rem;
}

button:hover:not(:disabled) {
    background: #e2e8f0;
    transform: translateY(-2px);
}

button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

button.active {
    background: var(--accent-blue);
    color: white;
    box-shadow: 0 4px 10px rgba(52, 152, 219, 0.3);
}

.divider {
    width: 1px;
    height: 28px;
    background: rgb(220 220 220);
    margin: 0 5px;
}

.settings {
    display: flex;
    gap: 15px;
}

.input-wrapper,
.slider-wrapper {
    display: flex;
    align-items: center;
    gap: 10px;
}

.icon-label {
    color: var(--text-muted);
    font-size: 0.9rem;
}

input[type="color"] {
    -webkit-appearance: none;
    border: none;
    width: 28px;
    height: 28px;
    border-radius: var(--border-circle);
    cursor: pointer;
    background: none;
}

input[type="color"]::-webkit-color-swatch-wrapper {
    padding: 0;
}

input[type="color"]::-webkit-color-swatch {
    border: 2px solid var(--glass-border);
    border-radius: var(--border-circle);
}

input[type="range"] {
    width: 80px;
    accent-color: var(--accent-blue);
    cursor: pointer;
}

.size-text {
    font-size: 0.8rem;
    font-weight: 700;
    min-width: 35px;
    color: var(--text-main);
}

.danger-btn:hover {
    background: var(--color-danger) !important;
    color: white;
}

.save-btn {
    width: auto;
    padding: 0 15px;
    background: var(--color-viewer);
    color: white;
    font-weight: 700;
    font-size: 0.9rem;
    gap: 8px;
}

.save-btn:hover:not(:disabled) {
    background: #27ae60;
    box-shadow: 0 4px 12px rgba(46, 204, 113, 0.3);
}

.save-btn:disabled {
    background: var(--color-offline);
}

@media (max-width: 900px) {
    .drawing-toolbar {
        flex-wrap: wrap;
        justify-content: center;
    }
}
</style>