<template>
    <div class="notification-list-container">
        <TransitionGroup name="list">
            <NotificationItem v-for="n in notifications" :key="n.id" :type="n.type" :message="n.message"
                @close="removeNotify(n.id)" />
        </TransitionGroup>
    </div>
</template>

<script setup lang="ts">
import NotificationItem from './NotificationItem.vue';
import { useNotifications } from '@/ts/utils/notifications';

const { notifications, removeNotify } = useNotifications();
</script>

<style scoped>
.notification-list-container {
    position: fixed;
    bottom: 20px;
    right: 20px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    z-index: 9999;
    pointer-events: none;
}

.list-enter-active,
.list-leave-active {
    transition: all 0.4s ease;
}

.list-enter-from {
    transform: translateX(100%);
    opacity: 0;
}

.list-leave-to {
    transform: translateX(100%);
    opacity: 0;
}
</style>