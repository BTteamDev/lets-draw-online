<template>
    <div class="canvas-wrapper">
        <canvas ref="canvasRef" width="1000" height="600"
            style="touch-action: none; cursor: crosshair; box-shadow: var(--card-shadow);"
            @pointerdown="handlePointerDown" @pointermove="handlePointerMove" @pointerup="handlePointerUp"
            @pointerleave="handlePointerLeave" @pointercancel="handlePointerUp" @wheel.prevent="handleWheel"
            @contextmenu.prevent></canvas>

        <div class="canvas-coords" v-if="cursorPos">
            {{ Math.round(cursorPos.x) }}, {{ Math.round(cursorPos.y) }}
        </div>

        <div class="zoom-bar">
            <button class="zoom-btn" @click="zoomStep(1)" title="Приблизить">
                <i class="fa-solid fa-plus"></i>
            </button>
            <input type="range" class="zoom-slider" min="0.1" max="10" step="0.01" :value="scale"
                @input="onZoomSlider" />
            <button class="zoom-btn" @click="zoomStep(-1)" title="Отдалить">
                <i class="fa-solid fa-minus"></i>
            </button>
            <span class="zoom-label">{{ Math.round(scale * 100) }}%</span>
        </div>

        <div class="pan-bar">
            <input type="range" class="pan-slider" :min="panMin" :max="panMax" step="1" :value="-offset.x"
                @input="onPanSlider" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { Line, DrawPoint, ToolType } from '@/ts/utils/interfaces';

const props = defineProps<{
    color: string;
    width: number;
    tool: ToolType;
    lines: Line[];
    opacity: number;
}>();

const emit = defineEmits(['line-finished', 'color-picked']);

const canvasRef = ref<HTMLCanvasElement | null>(null);
const isDrawing = ref(false);
const currentLine = ref<Line | null>(null);

const offset = ref({ x: 0, y: 0 });
const scale = ref(1);
const isPanning = ref(false);
const startPanPos = ref({ x: 0, y: 0 });
const cursorPos = ref<{ x: number; y: number } | null>(null);

const getPos = (e: PointerEvent): DrawPoint => {
    if (!canvasRef.value) return { x: 0, y: 0 };
    const rect = canvasRef.value.getBoundingClientRect();
    return {
        x: (e.clientX - rect.left - offset.value.x) / scale.value,
        y: (e.clientY - rect.top - offset.value.y) / scale.value,
        pressure: e.pressure || 0.5,
        tiltX: e.tiltX,
        tiltY: e.tiltY
    };
};

const handleWheel = (e: WheelEvent) => {
    if (!canvasRef.value) return;
    const rect = canvasRef.value.getBoundingClientRect();

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
    const newScale = Math.min(Math.max(scale.value * zoomFactor, 0.1), 10);

    offset.value.x = mouseX - (mouseX - offset.value.x) * (newScale / scale.value);
    offset.value.y = mouseY - (mouseY - offset.value.y) * (newScale / scale.value);
    scale.value = newScale;

    redraw();
};

const handlePointerDown = (e: PointerEvent) => {
    if (e.button === 1) e.preventDefault();
    if (e.button === 1) {
        e.preventDefault();
        isPanning.value = true;
        startPanPos.value = { x: e.clientX - offset.value.x, y: e.clientY - offset.value.y };
        canvasRef.value?.setPointerCapture(e.pointerId);
        return;
    }

    if (e.button !== 0 && e.pointerType === 'mouse') return;

    if (props.tool === 'hand') {
        isPanning.value = true;
        startPanPos.value = { x: e.clientX - offset.value.x, y: e.clientY - offset.value.y };
        canvasRef.value?.setPointerCapture(e.pointerId);
        return;
    }

    if (props.tool === 'picker') {
        isDrawing.value = true;
        pickColor(e);
        return;
    }

    isDrawing.value = true;
    canvasRef.value?.setPointerCapture(e.pointerId);

    const worldPos = getPos(e);

    currentLine.value = {
        points: [worldPos],
        color: props.color,
        width: props.width,
        tool: props.tool,
        opacity: props.opacity
    };

    redraw();
};

const handlePointerMove = (e: PointerEvent) => {
    const pos = getPos(e);
    cursorPos.value = pos;

    if (isPanning.value) {
        offset.value.x = e.clientX - startPanPos.value.x;
        offset.value.y = e.clientY - startPanPos.value.y;
        redraw();
        return;
    }

    if (!isDrawing.value) return;

    if (props.tool === 'picker') {
        pickColor(e);
        return;
    }

    if (!currentLine.value) return;

    const worldPos = getPos(e);

    if (props.tool === 'brush' || props.tool === 'eraser') {
        const points = currentLine.value.points;
        const lastPoint = points[points.length - 1];
        if (lastPoint) {
            const dist = Math.hypot(worldPos.x - lastPoint.x, worldPos.y - lastPoint.y);
            if (dist < 2) return;
        }
        currentLine.value.points.push(worldPos);
    } else {
        currentLine.value.points[1] = worldPos;
    }
    redraw();
};

const handlePointerUp = (e: PointerEvent) => {
    if (isPanning.value) {
        isPanning.value = false;
        canvasRef.value?.releasePointerCapture(e.pointerId);
        return;
    }

    if (!isDrawing.value) return;
    isDrawing.value = false;
    canvasRef.value?.releasePointerCapture(e.pointerId);

    if (currentLine.value) {
        emit('line-finished', { ...currentLine.value });
        currentLine.value = null;
    }
};

const handlePointerLeave = (e: PointerEvent) => {
    cursorPos.value = null;
    handlePointerUp(e);
};


const pickColor = (e: PointerEvent) => {
    const ctx = canvasRef.value?.getContext('2d', { willReadFrequently: true });
    if (!ctx || !canvasRef.value) return;

    const rect = canvasRef.value.getBoundingClientRect();
    const x = Math.floor(e.clientX - rect.left);
    const y = Math.floor(e.clientY - rect.top);
    const imageData = ctx.getImageData(x, y, 1, 1);

    const r = imageData.data[0] ?? 0;
    const g = imageData.data[1] ?? 0;
    const b = imageData.data[2] ?? 0;

    const toHex = (n: number) => n.toString(16).padStart(2, '0');
    emit('color-picked', `#${toHex(r)}${toHex(g)}${toHex(b)}`);
};

const drawLine = (ctx: CanvasRenderingContext2D, line: Line) => {
    if (!line.points || line.points.length === 0) return;

    const start = line.points[0];
    const end = line.points[line.points.length - 1];
    if (!start || !end) return;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = line.opacity;

    if (line.tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = line.color;
    }

    if (line.tool === 'brush' || line.tool === 'eraser') {
        if (line.points.length === 1) {
            const p = line.points[0]!;
            const r = (line.width * (p.pressure ?? 0.5)) / 2;
            ctx.beginPath();
            ctx.arc(p.x, p.y, Math.max(r, 0.5), 0, Math.PI * 2);
            ctx.fillStyle = line.tool === 'eraser' ? 'rgba(0,0,0,1)' : line.color;
            ctx.fill();
        } else if (line.points.length === 2) {
            const p0 = line.points[0]!;
            const p1 = line.points[1]!;
            ctx.beginPath();
            ctx.lineWidth = line.width * (0.4 + (p1.pressure ?? 0.5) * 1.2);
            ctx.moveTo(p0.x, p0.y);
            ctx.lineTo(p1.x, p1.y);
            ctx.stroke();
        } else {
            for (let i = 1; i < line.points.length - 1; i++) {
                const prev = line.points[i - 1]!;
                const curr = line.points[i]!;
                const next = line.points[i + 1]!;

                const pressure = curr.pressure ?? 0.5;
                ctx.beginPath();
                ctx.lineWidth = line.width * (0.4 + pressure * 1.2);

                const midPrev = { x: (prev.x + curr.x) / 2, y: (prev.y + curr.y) / 2 };
                const midNext = { x: (curr.x + next.x) / 2, y: (curr.y + next.y) / 2 };

                ctx.moveTo(midPrev.x, midPrev.y);
                ctx.quadraticCurveTo(curr.x, curr.y, midNext.x, midNext.y);
                ctx.stroke();
            }

            const secondLast = line.points[line.points.length - 2]!;
            const last = line.points[line.points.length - 1]!;
            const midLast = {
                x: (secondLast.x + last.x) / 2,
                y: (secondLast.y + last.y) / 2
            };
            ctx.beginPath();
            ctx.lineWidth = line.width * (0.4 + (last.pressure ?? 0.5) * 1.2);
            ctx.moveTo(midLast.x, midLast.y);
            ctx.lineTo(last.x, last.y);
            ctx.stroke();
        }
    } else if (line.tool === 'rect' && line.points[1]) {
        ctx.beginPath();
        ctx.lineWidth = line.width;
        ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
    } else if (line.tool === 'circle' && line.points[1]) {
        const rx = Math.abs(end.x - start.x) / 2;
        const ry = Math.abs(end.y - start.y) / 2;
        const cx = (start.x + end.x) / 2;
        const cy = (start.y + end.y) / 2;
        ctx.beginPath();
        ctx.lineWidth = line.width;
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
    } else if (line.tool === 'line' && line.points[1]) {
        ctx.beginPath();
        ctx.lineWidth = line.width;
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
    }

    ctx.restore();
};

const redraw = () => {
    const ctx = canvasRef.value?.getContext('2d');
    if (!ctx || !canvasRef.value) return;

    ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height);
    ctx.save();
    ctx.translate(offset.value.x, offset.value.y);
    ctx.scale(scale.value, scale.value);

    const allLines = [...props.lines];
    if (currentLine.value) allLines.push(currentLine.value);
    allLines.forEach(line => drawLine(ctx, line));

    ctx.restore();
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

const panMin = -4000;
const panMax = 4000;

const onZoomSlider = (e: Event) => {
    const newScale = Number((e.target as HTMLInputElement).value);
    if (!canvasRef.value) return;
    const cx = canvasRef.value.width / 2;
    const cy = canvasRef.value.height / 2;
    offset.value.x = cx - (cx - offset.value.x) * (newScale / scale.value);
    offset.value.y = cy - (cy - offset.value.y) * (newScale / scale.value);
    scale.value = newScale;
    redraw();
};

const zoomStep = (dir: 1 | -1) => {
    const factor = dir === 1 ? 1.2 : 1 / 1.2;
    const newScale = Math.min(Math.max(scale.value * factor, 0.1), 10);
    if (!canvasRef.value) return;
    const cx = canvasRef.value.width / 2;
    const cy = canvasRef.value.height / 2;
    offset.value.x = cx - (cx - offset.value.x) * (newScale / scale.value);
    offset.value.y = cy - (cy - offset.value.y) * (newScale / scale.value);
    scale.value = newScale;
    redraw();
};

const onPanSlider = (e: Event) => {
    offset.value.x = -Number((e.target as HTMLInputElement).value);
    redraw();
};

defineExpose({ getCanvasPreview });
watch(() => props.lines, redraw, { deep: true });
</script>

<style scoped>
.canvas-wrapper {
    position: relative;
    display: inline-block;
    line-height: 0;
    z-index: 0;
}

.zoom-bar {
    position: absolute;
    top: 40px;
    bottom: 30px;
    right: 10px;
    width: 32px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 6px 0;
    background: var(--toolbar-bg);
    backdrop-filter: var(--glass-blur);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-sm);
    box-shadow: var(--card-shadow);
    pointer-events: all;
}

.zoom-btn {
    width: 22px;
    height: 22px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--input-bg);
    border: none;
    border-radius: var(--radius-sm);
    color: var(--text-main);
    cursor: pointer;
    font-size: 0.7rem;
    transition: var(--btn-transition);
}

.zoom-btn:hover {
    background: var(--accent-blue);
    color: white;
}

.zoom-slider {
    flex: 1;
    writing-mode: vertical-lr;
    direction: rtl;
    -webkit-appearance: slider-vertical;
    width: 4px;
    min-height: 0;
    accent-color: var(--accent-blue);
    cursor: pointer;
}

.zoom-label {
    font-size: 0.55rem;
    font-family: 'Courier New', monospace;
    color: var(--text-muted);
    white-space: nowrap;
    flex-shrink: 0;
}

.pan-bar {
    position: absolute;
    bottom: 10px;
    left: 10px;
    right: 50px;
    height: 22px;
    display: flex;
    align-items: center;
    padding: 0 8px;
    background: var(--toolbar-bg);
    backdrop-filter: var(--glass-blur);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-sm);
    box-shadow: var(--card-shadow);
}

.pan-slider {
    width: 100%;
    accent-color: var(--accent-blue);
    cursor: pointer;
}
</style>