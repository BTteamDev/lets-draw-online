<template>
    <div v-if="authState.user.role === 'superadmin'" style="color: red; font-size: 10px;">
        Debug: isMuted = {{ isMuted }} (Type: {{ typeof isMuted }})
    </div>
    <div class="chat-container">
        <div class="messages-log" ref="messagesLog">
            <div v-for="msg in messages" :key="msg.id" :class="['message', msg.role]">
                <div class="message-content">
                    <span class="msg-time">{{ formatTime(msg.timestamp) }}</span>

                    <span v-if="msg.role === 'admin'" class="role-badge admin">
                        <i class="fa-solid fa-shield-halved"></i>
                    </span>
                    <span v-else-if="msg.role === 'mod'" class="role-badge mod">
                        <i class="fa-solid fa-shield-halved"></i>
                    </span>

                    <span class="msg-author">{{ msg.username }}</span>
                    <span class="msg-divider">:</span>
                    <span class="message-body">{{ msg.text }}</span>
                </div>
            </div>
        </div>
    </div>

    <div class="chat-box" :class="{ 'is-muted': isMuted }">
        <div :class="['chat-switcher', { 'admin-mode': chatType === 'adm' }, { 'mod-mode': chatType === 'mod' }]"
            @mousedown="!isMuted && switchChatType()"
            :title="isMuted ? 'Чат заблокирован' : chatTypeTitle"
            :style="authState.user.role !== 'superadmin' && authState.user.role !== 'admin' && authState.user.role !== 'mod' ? 'cursor: auto' : ''">
            <i :class="{
                'fa-solid fa-crown': chatType === 'adm',
                'fa-solid fa-shield-halved': chatType === 'mod',
                'fa-solid fa-comment-dots': chatType === 'say'
            }"></i>
            <span class="type-label">{{ chatType === 'say' ? 'SAY' : chatType.toUpperCase() }}</span>
        </div>

        <input type="text" :placeholder="isMuted ? 'Администратор запретил Вам писать в чат' : 'Напишите сообщение...'"
            v-model="newMessageText" @keyup.enter="sendMessage" :disabled="isMuted" :class="{ 'input-error': isMuted }"
            :title="isMuted ? 'Вам запрещено писать в чат' : ''">

        <button class="send-btn" @click="sendMessage" :disabled="isMuted">
            <i class="fa-solid fa-paper-plane"></i>
        </button>
    </div>
    <NotificationList />
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch, computed } from 'vue';
import type { ChatMessage, SystemRole } from '@/ts/utils/interfaces';
import { socket } from '@/ts/utils/socket';
import { authState } from '@/ts/store/auth';
import { useNotifications } from '@/ts/utils/notifications';
import NotificationList from '../notification/NotificationList.vue';

const { addNotify } = useNotifications();

const props = defineProps<{
    roomId: string;
    username: string;
    role: string;
}>();

const messages = ref<ChatMessage[]>([]);
const newMessageText = ref('');
const chatType = ref<'say' | 'adm' | 'mod'>('say');
const messagesLog = ref<HTMLElement | null>(null);

const localIsMuted = ref(false);
const isMuted = computed(() => localIsMuted.value || authState.user?.isMuted || false);

const scrollToBottom = async () => {
    await nextTick();
    if (messagesLog.value) {
        messagesLog.value.scrollTop = messagesLog.value.scrollHeight;
    }
};

const switchChatType = () => {
    const role = authState.user.role;
    const isSA = role === 'superadmin';
    const isAdmin = role === 'admin';
    const isMod = role === 'moderator'; 

    if (chatType.value === 'say') {
        if (isSA || isAdmin) {
            chatType.value = 'adm';
        } else if (isMod) {
            chatType.value = 'mod';
        }
    } else if (chatType.value === 'adm') {
        if (isSA || isMod) {
            chatType.value = 'mod';
        } else {
            chatType.value = 'say';
        }
    } else if (chatType.value === 'mod') {
        chatType.value = 'say';
    }
};

const chatTypeTitle = computed(() => {
    if (chatType.value === 'say') {
        return 'Общий чат';
    } else if (chatType.value === 'adm') {
        return 'Админ-чат';
    } else if (chatType.value === 'mod') {
        return 'Мод-чат';
    }
})

const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const sendMessage = () => {
    if (isMuted.value) {
        addNotify('error', 'Отправка сообщения невозможна');
        return;
    }
    if (!newMessageText.value.trim()) return;

    const savedUser = localStorage.getItem('user');
    const userId = savedUser ? JSON.parse(savedUser) : { username: 'Аноним', id: 'guest' };

    const msg: ChatMessage = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        userId: userId,
        username: props.username,
        text: newMessageText.value,
        timestamp: new Date().toISOString(),
        role: chatType.value === 'adm' ? 'admin' : (chatType.value === 'mod' ? 'mod' : 'user') as SystemRole,
    };

    socket.emit('send-message', { roomId: props.roomId, message: msg });

    messages.value.push(msg);
    newMessageText.value = '';
    scrollToBottom();
};

onMounted(() => {
    const savedUser = JSON.parse(localStorage.getItem('user') || '{}');

    if (savedUser.isMuted !== undefined) {
        localIsMuted.value = savedUser.isMuted;
    }

    if (savedUser.id) {
        socket.emit('register-self', savedUser.id);
    }

    socket.on('mute_status_changed', (data: { isMuted: boolean }) => {
        localIsMuted.value = data.isMuted;
        const action = data.isMuted ? 'запретил Вам писать в чат' : 'разрешил Вам писать в чат';
        addNotify(data.isMuted ? 'warning' : 'success', `Администратор ${action}`, 10000);
        if (authState.user) {
            Object.assign(authState.user, { isMuted: data.isMuted });

            const updatedUser = { ...savedUser, isMuted: data.isMuted };
            localStorage.setItem('user', JSON.stringify(updatedUser));
        }
    });

    socket.on('new-message', (msg: ChatMessage) => {
        if (msg.userId !== JSON.parse(localStorage.getItem('user') || '{}').id) {
            messages.value.push(msg);
            scrollToBottom();
        }
    });
});
</script>

<style scoped>
.chat-container {
    display: flex;
    flex-direction: column;
    background: var(--chat-log-bg);
    backdrop-filter: blur(8px);
    border-radius: var(--radius-main) var(--radius-main) 0 0;
    border: 1px solid var(--glass-border);
    padding: 12px;
    max-height: 440px;
}

.messages-log {
    flex: 1;
    overflow-y: auto;
    height: 350px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding-right: 8px;
}

.messages-log::-webkit-scrollbar {
    width: 4px;
}

.messages-log::-webkit-scrollbar-track {
    background: transparent;
}

.messages-log::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 10px;
}

.message {
    font-size: 0.95rem;
    line-height: 1.4;
    transition: background 0.2s;
    border-radius: 4px;
    padding: 2px 4px;
}

.message:hover {
    background: rgba(255, 255, 255, 0.05);
}

.message-content {
    display: flex;
    align-items: baseline;
    gap: 6px;
    flex-wrap: wrap;
}

.msg-time {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.4);
    font-family: monospace;
}

.msg-author {
    font-weight: 700;
    color: var(--accent-blue);
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.msg-divider {
    color: rgba(255, 255, 255, 0.5);
}

.message-body {
    color: #efefef;
    word-break: break-word;
    text-shadow: var(--text-shadow);
}

.role-badge {
    font-size: 0.7rem;
    padding: 1px 4px;
    border-radius: 3px;
}

.role-badge.editor {
    color: var(--color-editor);
}

.message.admin .msg-author {
    color: var(--color-dev);
}

.message.mod .msg-author {
    color: var(--color-mod);
}

.message.system {
    font-style: italic;
    opacity: 0.8;
}

.message.system .message-body {
    color: #c3d5d6;
}

.chat-box {
    display: flex;
    align-items: center;
    gap: 10px;
    background: rgba(0, 0, 0, 0.5);
    border: 1px solid var(--glass-border);
    border-top: none;
    border-radius: 0 0 var(--radius-main) var(--radius-main);
    padding: 8px 12px;
}

.chat-switcher {
    display: flex;
    align-items: center;
    gap: 5px;
    cursor: pointer;
    color: var(--text-on-dark);
    font-size: 0.8rem;
    font-weight: 800;
    padding: 4px 8px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: var(--radius-sm);
    transition: var(--btn-transition);
    min-width: 65px;
    user-select: none;
    -webkit-user-drag: none;
}

.chat-switcher.admin-mode {
    background: rgba(189, 62, 145, 0.2);
    color: var(--color-dev);
}

.chat-switcher.mod-mode {
    background: rgba(95, 47, 143, 0.2);
    color: var(--color-mod);
}

.chat-box input {
    flex: 1;
    background: none;
    border: none;
    outline: none;
    color: #fff;
    font-size: 0.9rem;
}

.chat-box input::placeholder {
    color: rgba(255, 255, 255, 0.3);
}

.send-btn {
    background: none;
    border: none;
    color: var(--accent-blue);
    cursor: pointer;
    font-size: 1.1rem;
    padding: 4px;
    transition: var(--btn-transition);
}

.send-btn:hover {
    color: var(--accent-purple);
    transform: scale(1.1) translateX(2px);
}

.is-muted input {
    background-color: rgba(231, 76, 60, 0.05) !important;
    cursor: not-allowed;
    color: var(--color-danger) !important;
}

.is-muted input::placeholder {
    color: var(--color-danger);
    opacity: 0.7;
}

.is-muted .chat-switcher,
.is-muted .send-btn {
    opacity: 0.5;
    filter: grayscale(1);
    pointer-events: none;
}
</style>