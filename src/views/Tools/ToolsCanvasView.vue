<template>
    <div class="tools-page">
        <h2>Песочница: Рисование + API</h2>

        <Toolbar v-model:color="settings.color" v-model:width="settings.width" :is-saving="isSaving" @undo="undo"
            @clear="clearCanvas" @save="saveToCloud" />

        <canvas ref="canvasRef" width="800" height="500" @mousedown="startDrawing" @mousemove="draw"
            @mouseup="stopDrawing" @mouseleave="stopDrawing" class="drawing-canvas"></canvas>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import type { DrawPoint, Line } from '@/ts/utils/interfaces';
import Toolbar from '@/components/drawing/Toolbar.vue';
import { drawingAPI } from '@/ts/utils/api';

const canvasRef = ref<HTMLCanvasElement | null>(null);
const lines = ref<Line[]>([]);
const currentLine = ref<Line | null>(null);
const isSaving = ref(false);

const settings = reactive({
    color: '#0984e3',
    width: 5
});

const saveToCloud = async () => {
    if (lines.value.length === 0) {
        alert('Невозможно сохранить пустой холст.');
        return;
    }

    isSaving.value = true;
    try {
        const payload = {
            name: 'Тестовый рисунок',
            lines: lines.value
        };

        const response = await drawingAPI.save(payload);
        console.log('Успешно!', response.data);
        alert('Рисунок сохранен в БД, ID: ' + response.data.id);
    } catch (error) {
        console.error('Ошибка сохранения:', error);
        alert('Не удалось сохранить. Проверьте консоль сервера.');
    } finally {
        isSaving.value = false;
    }
};

const getPos = (e: MouseEvent): DrawPoint => {
    const canvas = canvasRef.value!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
};

const redraw = () => {
    const canvas = canvasRef.value;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const allLines: Line[] = [...lines.value];
    if (currentLine.value) {
        allLines.push(currentLine.value);
    }

    allLines.forEach(line => {
        const points = line?.points;

        if (!points || points.length < 2) return;

        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        ctx.strokeStyle = line.color;
        ctx.lineWidth = line.width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        for (let i = 1; i < line.points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.stroke();
    });
};

const startDrawing = (e: MouseEvent) => {
    const { x, y } = getPos(e);
    currentLine.value = {
        points: [{ x, y }],
        color: settings.color,
        width: settings.width
    };
    redraw();
};

const draw = (e: MouseEvent) => {
    if (!currentLine.value) return;
    currentLine.value.points.push(getPos(e));
    redraw();
};

const stopDrawing = () => {
    if (currentLine.value) {
        lines.value.push(currentLine.value);
        currentLine.value = null;
    }
};

const clearCanvas = () => {
    lines.value = [];
    redraw();
};

const undo = () => {
    lines.value.pop();
    redraw();
};
</script>

<style scoped>
section {
    display: flex;
    justify-content: center;
    flex-direction: column;
    align-items: center;
}

.drawing-canvas {
    background: white;
    border: 2px solid #dfe6e9;
    border-radius: 8px;
    cursor: crosshair;
    display: block;
    margin: 0 auto;
}
</style>