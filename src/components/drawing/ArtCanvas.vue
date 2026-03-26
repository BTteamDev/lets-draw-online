<template>
    <canvas ref="canvasRef" width="800" height="600" @mousedown="start" @mousemove="move" @mouseup="stop"
        @mouseleave="stop"></canvas>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import type { Line, DrawPoint, ToolType } from '@/ts/utils/interfaces';

const props = defineProps<{
    color: string;
    width: number;
    tool: ToolType;
    lines: Line[];
    opacity: number
}>();

const emit = defineEmits(['line-finished', 'color-picked']);

const canvasRef = ref<HTMLCanvasElement | null>(null);
const isDrawing = ref(false);
const currentLine = ref<Line | null>(null);

const getCanvasPreview = (): string => {
    if (!canvasRef.value) return '';

    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');

    tempCanvas.width = 340;
    tempCanvas.height = 320;

    if (tempCtx) {
        tempCtx.fillStyle = '#ffffff';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

        tempCtx.drawImage(canvasRef.value, 0, 0, tempCanvas.width, tempCanvas.height);

        return tempCanvas.toDataURL('image/jpeg', 0.85);
    }
    return '';
};
defineExpose({ getCanvasPreview });

const getPos = (e: MouseEvent): DrawPoint => {
    const rect = canvasRef.value!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
};

const pickColor = (e: MouseEvent) => {
    const ctx = canvasRef.value?.getContext('2d', { willReadFrequently: true });
    if (!ctx || !canvasRef.value) return;

    const rect = canvasRef.value.getBoundingClientRect();
    const x = Math.floor(e.clientX - rect.left);
    const y = Math.floor(e.clientY - rect.top);

    const imageData = ctx.getImageData(x, y, 1, 1);
    const data = imageData.data;

    if (data && data.length >= 3) {
        const r = data[0];
        const g = data[1];
        const b = data[2];

        const toHex = (n: number) => n.toString(16).padStart(2, '0');
        const hex = `#${toHex(r!)}${toHex(g!)}${toHex(b!)}`;

        emit('color-picked', hex);
    }
};

const redraw = () => {
    const ctx = canvasRef.value?.getContext('2d');
    if (!ctx || !canvasRef.value) return;

    ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height);

    const allLines = [...props.lines];
    if (currentLine.value) allLines.push(currentLine.value);

    allLines.forEach(line => {
        if (line.points.length === 0) return;

        ctx.beginPath();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = line.color;
        ctx.lineWidth = line.width;
        ctx.globalAlpha = line.opacity;

        const start = line.points[0];
        const end = line.points[line.points.length - 1];

        if (!start || !end) return;

        if (line.tool === 'brush' || line.tool === 'eraser') {
            line.points.forEach((p, i) => {
                if (i === 0) ctx.moveTo(p.x, p.y);
                else ctx.lineTo(p.x, p.y);
            });
        }
        else if (line.tool === 'rect') {
            const width = end.x - start.x;
            const height = end.y - start.y;

            ctx.rect(start.x, start.y, width, height);

            if (line.opacity < 1) {
                ctx.fillStyle = line.color;
                ctx.fill();
            }

            ctx.stroke();
        }
        else if (line.tool === 'circle') {
            const radius = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
            ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI);

            if (line.opacity < 1) {
                ctx.fillStyle = line.color;
                ctx.fill();
            }

            ctx.stroke();
        }
        else if (line.tool === 'line') {
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
        }
        ctx.stroke();
    });

    ctx.globalAlpha = 1;
};

const move = (e: MouseEvent) => {
    if (!isDrawing.value || !currentLine.value) return;

    const pos = getPos(e);

    if (props.tool === 'brush' || props.tool === 'eraser') {
        currentLine.value.points.push(pos);
    } else if (props.tool === 'picker') {
        pickColor(e);
        return;
    } else {
        currentLine.value.points[1] = pos;
    }
    redraw();
};

watch(() => props.lines, redraw, { deep: true });

const start = (e: MouseEvent) => {
    isDrawing.value = true;
    const { x, y } = getPos(e);
    currentLine.value = {
        points: [{ x, y }],
        color: props.tool === 'eraser' ? '#ffffff' : props.color,
        width: props.width,
        tool: props.tool,
        opacity: props.opacity
    };
    redraw();
};

//const move = (e: MouseEvent) => {
//  if (!isDrawing.value || !currentLine.value) return;
//  currentLine.value.points.push(getPos(e));
//  redraw();
//};

const stop = () => {
    if (!isDrawing.value) return;
    isDrawing.value = false;
    if (currentLine.value) {
        emit('line-finished', { ...currentLine.value });
        currentLine.value = null;
    }
};
</script>