<template>
    <div :class="['notification-item', type]">
        <div class="content">{{ message }}</div>
        <button class="close-btn" @click="$emit('close')">&times;</button>
    </div>
</template>

<script setup lang="ts">
defineProps<{ message: string; type: 'error' | 'warning' | 'info' | 'success' }>();
defineEmits(['close']);
</script>

<style scoped>
.notification-item {
    padding: 12px 20px;
    border-radius: 8px;
    color: white;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    min-width: 250px;
    pointer-events: auto;
}

.error {
    background: var(--color-danger);
    border-left: 5px solid #b33939;
}

.warning {
    background: var(--color-warning);
    border-left: 5px solid #e67e22;
    color: #2f3542;
}

.info {
    background: #2f3542;
    border-left: 5px solid #1e90ff;
}

.success {
    background: var(--color-success);
    border-left: 5px solid #3acc3f;
}

.close-btn {
    background: none;
    border: none;
    color: inherit;
    font-size: 20px;
    cursor: pointer;
    opacity: 0.7;
}

.close-btn:hover {
    opacity: 1;
}
</style>