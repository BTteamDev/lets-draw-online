<template>
    <canvas 
        ref="canvasRef" 
        width="800" 
        height="600" 
        style="touch-action: none; cursor: crosshair;"
        @pointerdown="handlePointerDown" 
        @pointermove="handlePointerMove" 
        @pointerup="handlePointerUp"
        @pointerleave="handlePointerUp"
        @pointercancel="handlePointerUp"
    ></canvas>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
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

const getPos = (e: PointerEvent): DrawPoint => {
    if (!canvasRef.value) return { x: 0, y: 0 };
    const rect = canvasRef.value.getBoundingClientRect();
    return { 
        x: e.clientX - rect.left, 
        y: e.clientY - rect.top 
    };
};

const handlePointerDown = (e: PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    
    isDrawing.value = true;
    const { x, y } = getPos(e);
    
    canvasRef.value?.setPointerCapture(e.pointerId);

    if (props.tool === 'picker') {
        pickColor(e);
        return;
    }

    currentLine.value = {
        points: [{ x, y }],
        color: props.tool === 'eraser' ? '#ffffff' : props.color,
        width: props.width,
        tool: props.tool,
        opacity: props.opacity
    };
    redraw();
};

const handlePointerMove = (e: PointerEvent) => {
    if (!isDrawing.value || !currentLine.value) {
        if (props.tool === 'picker' && isDrawing.value) pickColor(e);
        return;
    }

    const pos = getPos(e);

    if (props.tool === 'brush' || props.tool === 'eraser') {
        const points = currentLine.value.points;
        const lastPoint = points[points.length - 1];

        if (lastPoint) {
            const dist = Math.hypot(pos.x - lastPoint.x, pos.y - lastPoint.y);
            if (dist < 2) return;
        }

        currentLine.value.points.push(pos);
    } else {
        currentLine.value.points[1] = pos;
    }
    redraw();
};

const handlePointerUp = (e: PointerEvent) => {
    if (!isDrawing.value) return;
    isDrawing.value = false;
    
    // Освобождаем указатель
    canvasRef.value?.releasePointerCapture(e.pointerId);

    if (currentLine.value) {
        emit('line-finished', { ...currentLine.value });
        currentLine.value = null;
    }
};

const pickColor = (e: PointerEvent) => {
    const ctx = canvasRef.value?.getContext('2d', { willReadFrequently: true });
    if (!ctx || !canvasRef.value) return;

    const pos = getPos(e);
    const imageData = ctx.getImageData(Math.floor(pos.x), Math.floor(pos.y), 1, 1);
    
    const r = imageData.data[0] ?? 0;
    const g = imageData.data[1] ?? 0;
    const b = imageData.data[2] ?? 0;

    const toHex = (n: number) => n.toString(16).padStart(2, '0');
    const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    emit('color-picked', hex);
};

const redraw = () => {
    const ctx = canvasRef.value?.getContext('2d');
    if (!ctx || !canvasRef.value) return;

    ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height);

    const allLines = [...props.lines];
    if (currentLine.value) allLines.push(currentLine.value);

    allLines.forEach(line => {
        if (!line.points || line.points.length === 0) return;

        ctx.beginPath();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = line.color;
        ctx.lineWidth = line.width;
        ctx.globalAlpha = line.opacity;

        const start = line.points[0];
        const end = line.points[line.points.length - 1] || start;

        if (!start || !end) return;

        if (line.tool === 'brush' || line.tool === 'eraser') {
            ctx.moveTo(start.x, start.y);
            for (let i = 1; i < line.points.length; i++) {
                const p = line.points[i];
                if (p) ctx.lineTo(p.x, p.y);
            }
        } else if (line.tool === 'rect') {
            ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
        } else if (line.tool === 'circle') {
            const radius = Math.hypot(end.x - start.x, end.y - start.y);
            ctx.arc(start.x, start.y, radius, 0, Math.PI * 2);
        } else if (line.tool === 'line') {
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
        }
        ctx.stroke();
    });
    ctx.globalAlpha = 1;
};

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
watch(() => props.lines, redraw, { deep: true });
</script>