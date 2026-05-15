<template>
    <div class="color-selector" ref="selectorRef">
        <button
            class="color-trigger"
            :class="{ open: isOpen, disabled: disabled }"
            @click="!disabled && (isOpen = !isOpen)"
            :title="disabled ? 'Недоступно для ластика' : 'Выбрать цвет'"
        >
            <span class="color-swatch" :style="{ background: modelValue }"></span>
            <i class="fa-solid fa-chevron-down chevron" :class="{ rotated: isOpen }"></i>
        </button>

        <Transition name="dropdown">
            <div v-if="isOpen" class="color-dropdown">
                <div class="palette-grid">
                    <button
                        v-for="preset in presets"
                        :key="preset"
                        class="palette-dot"
                        :class="{ selected: modelValue === preset }"
                        :style="{ background: preset }"
                        :title="preset"
                        @click="select(preset)"
                    >
                        <i v-if="modelValue === preset" class="fa-solid fa-check check-icon"></i>
                    </button>
                </div>

                <div class="divider-h"></div>

                <div v-if="recentColors.length" class="recent-section">
                    <span class="section-label">Недавние</span>
                    <div class="recent-row">
                        <button
                            v-for="c in recentColors"
                            :key="c"
                            class="palette-dot small"
                            :class="{ selected: modelValue === c }"
                            :style="{ background: c }"
                            :title="c"
                            @click="select(c)"
                        ></button>
                    </div>
                </div>

                <div class="divider-h"></div>

                <div class="hex-row">
                    <span class="hex-hash">#</span>
                    <input
                        class="hex-input"
                        v-model="hexInput"
                        maxlength="6"
                        spellcheck="false"
                        placeholder="3498db"
                        @input="onHexInput"
                        @keydown.enter="confirmHex"
                    />
                    <label class="native-picker-btn" title="Открыть палитру">
                        <i class="fa-solid fa-palette"></i>
                        <input type="color" :value="modelValue" @input="onNativePicker" tabindex="-1" />
                    </label>
                </div>
            </div>
        </Transition>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, computed } from 'vue';

const props = defineProps<{
    modelValue: string;
    disabled?: boolean;
}>();

const emit = defineEmits(['update:modelValue']);

const isOpen = ref(false);
const selectorRef = ref<HTMLElement | null>(null);
const hexInput = ref(props.modelValue.replace('#', ''));
const recentColors = ref<string[]>([]);

const presets = [
    '#000000', '#ffffff', '#ff4757', '#ff6b81',
    '#ffa502', '#ffdd59', '#7bed9f', '#2ed573',
    '#1e90ff', '#3498db', '#5352ed', '#9b59b6',
    '#2d3436', '#636e72', '#b2bec3', '#dfe6e9',
    '#e17055', '#fdcb6e', '#00cec9', '#fd79a8',
];

watch(() => props.modelValue, val => {
    hexInput.value = val.replace('#', '');
});

const isValidHex = (h: string) => /^[0-9a-fA-F]{6}$/.test(h);

const select = (color: string) => {
    emit('update:modelValue', color);
    hexInput.value = color.replace('#', '');
    addRecent(color);
    isOpen.value = false;
};

const addRecent = (color: string) => {
    const filtered = recentColors.value.filter(c => c !== color);
    recentColors.value = [color, ...filtered].slice(0, 8);
};

const onHexInput = () => {
    const cleaned = hexInput.value.replace(/[^0-9a-fA-F]/g, '');
    hexInput.value = cleaned;
    if (isValidHex(cleaned)) {
        emit('update:modelValue', `#${cleaned}`);
    }
};

const confirmHex = () => {
    if (isValidHex(hexInput.value)) {
        select(`#${hexInput.value}`);
    }
};

const onNativePicker = (e: Event) => {
    const val = (e.target as HTMLInputElement).value;
    select(val);
};

const onClickOutside = (e: MouseEvent) => {
    if (selectorRef.value && !selectorRef.value.contains(e.target as Node)) {
        isOpen.value = false;
    }
};

onMounted(() => document.addEventListener('mousedown', onClickOutside));
onBeforeUnmount(() => document.removeEventListener('mousedown', onClickOutside));
</script>

<style scoped>
.color-selector {
    position: relative;
}

.color-trigger {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0 10px;
    width: auto;
    height: 38px;
    background: var(--input-bg);
    border: 1px solid transparent;
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: var(--btn-transition);
    color: var(--text-muted);
    font-size: 0.75rem;
}

.color-trigger:hover:not(.disabled) {
    background: var(--input-bg-hover);
    border-color: var(--accent-blue);
    transform: translateY(-2px);
}

.color-trigger.open {
    border-color: var(--accent-blue);
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.15);
}

.color-trigger.disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

.color-swatch {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 2px solid var(--glass-border);
    flex-shrink: 0;
    box-shadow: 0 1px 4px rgba(0,0,0,0.2);
}

.chevron {
    transition: transform 0.2s ease;
}
.chevron.rotated {
    transform: rotate(180deg);
}

.color-dropdown {
    position: absolute;
    top: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%);
    background: var(--toolbar-bg);
    backdrop-filter: var(--glass-blur);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-main);
    box-shadow: var(--card-shadow-hover);
    padding: 14px;
    width: 220px;
    z-index: 1000;
}

.palette-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 7px;
}

.palette-dot {
    position: relative;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 2px solid transparent;
    cursor: pointer;
    transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
}

.palette-dot:hover {
    transform: scale(1.2);
    box-shadow: 0 3px 10px rgba(0,0,0,0.25);
}

.palette-dot.selected {
    border-color: var(--accent-blue);
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.4);
}

.palette-dot.small {
    width: 22px;
    height: 22px;
}

.check-icon {
    font-size: 0.6rem;
    color: white;
    text-shadow: 0 1px 2px rgba(0,0,0,0.6);
    pointer-events: none;
}

.divider-h {
    height: 1px;
    background: var(--glass-border);
    margin: 12px 0;
}

.recent-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.section-label {
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-muted);
}

.recent-row {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
}

.hex-row {
    display: flex;
    align-items: center;
    gap: 6px;
    background: var(--input-bg);
    border-radius: var(--radius-sm);
    padding: 0 8px;
    border: 1px solid transparent;
    transition: border-color 0.15s;
}

.hex-row:focus-within {
    border-color: var(--accent-blue);
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.hex-hash {
    font-size: 0.85rem;
    color: var(--text-muted);
    font-family: monospace;
    user-select: none;
}

.hex-input {
    flex: 1;
    background: none;
    border: none;
    outline: none;
    font-size: 0.85rem;
    font-family: 'Courier New', monospace;
    color: var(--text-main);
    padding: 8px 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    min-width: 0;
}

.hex-input::placeholder {
    color: var(--text-muted);
    opacity: 0.6;
    text-transform: none;
}

.native-picker-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    color: var(--text-muted);
    transition: color 0.15s, background 0.15s;
    flex-shrink: 0;
}

.native-picker-btn:hover {
    color: var(--accent-blue);
    background: rgba(52, 152, 219, 0.1);
}

.native-picker-btn input[type="color"] {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
    pointer-events: none;
}

.dropdown-enter-active,
.dropdown-leave-active {
    transition: opacity 0.15s ease, transform 0.15s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
    opacity: 0;
    transform: translateX(-50%) translateY(-6px);
}
</style>