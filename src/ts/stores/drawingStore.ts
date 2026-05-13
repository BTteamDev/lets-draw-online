import { defineStore } from "pinia";
import { ref } from "vue";
import type { ToolType } from "@/ts/utils/interfaces";

export const useDrawingStore = defineStore('drawing', () => {
    const currentTool = ref<ToolType>('brush');
    const offset = ref({ x: 0, y: 0 });
    const isDragging = ref(false);

    return { currentTool, offset, isDragging };
});