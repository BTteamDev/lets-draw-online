<template>
    <div class="tools-page">
        <h2>Тестовый UI</h2>

        <section class="preview-section">
            <h3>Карточка профиля</h3>
            <div class="user-card">
                <div class="avatars">
                    <div class="avatar-wrapper">
                        <img :src="testUser.avatarUrl" alt="avatar" class="avatar-main" />
                        <div :class="['status-dot', isOnline ? 'online' : 'offline']"></div>
                    </div>
                    <p>или</p>
                    <div class="avatar-wrapper">
                        <div class="avatar-main has-no-avatar">{{ initials ? initials : '??' }}</div>
                        <div :class="['status-dot', isOnline ? 'online' : 'offline']"></div>
                    </div>
                </div>

                <div class="user-info">
                    <span class="username">{{ testUser.username ? testUser.username : 'noname...' }}</span>
                    <span :class="['role-badge', testUser.role]">{{ testUser.role }}</span>
                </div>

                <div class="tags-list">
                    <span v-for="tag in testUser.tags" :key="tag.id" :class="['tag', `tag-${tag.name}`]"
                        :style="{ backgroundColor: tag.color }">
                        {{ tag.label }}
                    </span>
                </div>

            </div>

            <div class="initials-input-wrapper">
                <div class="inputs-wrapper">
                    <input type="text" placeholder="Имя..." v-model="firstName">
                    <input type="text" placeholder="Фамилия..." v-model="secondName">
                </div>
                <button v-on:click="">Применить</button>
            </div>

            <div class="param-line">
                <label for="online-checker">Статус: {{ isOnline ? 'онлайн' : 'оффлайн' }}</label>
                <input type="checkbox" id="online-checker" v-model="isOnline">
            </div>
        </section>

        <div class="dropdown-divider"></div>

        <section class="preview-section">
            <h3>Чатлог</h3>
            <div class="chat-container">
                <div v-for="msg in testMessages" :key="msg.id" :class="['message', msg.role]">
                    <div class="message-header">
                        <span class="msg-time">{{ formatTime(msg.timestamp) }}</span>
                        <span class="msg-role-prefix">{{ msg.role === 'admin' ? '[admin]' : '' }}</span>
                        <span class="msg-author">[{{ msg.username }}]:</span>
                    </div>
                    <div class="message-body">{{ msg.text }}</div>
                </div>
                <div class="chat-box">
                    <span :class="chatType === 'adm' ? ['chat-switcher', 'admin'] : 'chat-switcher'"
                        @mousedown="switchChatType()">
                        [{{ chatType }}]
                    </span>
                    <input type="text" placeholder="Сообщение..." v-model="newMessageText">
                    <button v-on:click="sendMessage()">Отправить</button>
                </div>
            </div>
        </section>
    </div>
</template>

<script setup lang="ts">
import type { ChatMessage, UserProfile } from '@/ts/utils/interfaces';
import { formatTime } from '@/ts/utils/format';
import { ref, computed } from 'vue';

const firstName = ref('');
const secondName = ref('');
const newMessageText = ref('');
const chatType = ref('say');
const isOnline = ref()

const userName = computed(() => `${firstName.value} ${secondName.value}`);

const testUser = computed<UserProfile>(() => ({
    id: '1',
    username: userName.value,
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lucky',
    role: 'admin',
    isOnline: isOnline.value,
    tags: [
        { id: 't1', name: 'art', label: 'Artist', color: '#74b9ff' },
        { id: 't2', name: 'dev', label: 'Developer', color: '#bd3e91' },
        { id: 't2', name: 'mod', label: 'Moderator', color: '#55efc4' }
    ]
}));

const testMessages = ref<ChatMessage[]>([
    {
        id: 'm1',
        userId: 'u1',
        username: 'CloudMaster',
        text: 'Всем привет! Добро пожаловать в рисовалку 🎨',
        timestamp: new Date().toISOString(),
        role: 'admin'
    },
    {
        id: 'm2',
        userId: 'u2',
        username: 'ArtFan_99',
        text: 'Сайт выглядит круто!',
        timestamp: new Date().toISOString(),
        role: 'viewer'
    },
    {
        id: 'm3',
        userId: 'u3',
        username: 'DenisKiller',
        text: 'Я сейчас попробую что-нибудь нарисовать',
        timestamp: new Date().toISOString(),
        role: 'editor'
    }
]);

const sendMessage = () => {
    if (!newMessageText.value.trim() || !userName.value.trim()) return;

    testMessages.value.push({
        id: Date.now().toString(),
        userId: 'u4',
        username: userName.value,
        text: newMessageText.value,
        timestamp: new Date().toISOString(),
        role: chatType.value === 'adm' ? 'admin' : 'viewer'
    });

    newMessageText.value = '';
};

const switchChatType = () => {
    return chatType.value === 'say'
        ? chatType.value = 'adm'
        : chatType.value = 'say'
}

// const switchOnline = () => {
//     return isOnline.value === true
//                         ? isOnline.value = false
//                         : isOnline.value = true
// }

const initials = computed(() => {
    return userName.value
        .trim()
        .split(/\s+/)
        .filter(word => word)
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
});
</script>


<style scoped>
h2 {
    text-align: center;
}

section {
    display: flex;
    justify-content: center;
    flex-direction: column;
    align-items: center;
}

.param-line {
    display: inline-flex;
    margin: 13px 0 13px 0;
    gap: 7px;
}

.user-card {
    background: var(--card-bg);
    padding: 20px;
    border-radius: var(--radius-main);
    box-shadow: var(--card-shadow);
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 250px;
}

.avatars {
    display: inline-flex;
    align-items: center;
    gap: 25px;
}

.avatar-main {
    background-color: brown;
    border-radius: var(--border-circle);
    width: 60px;
}

.has-no-avatar {
    display: flex;
    justify-content: center;
    align-items: center;
    color: white;
    height: 60px;
}

.status-dot {
    width: 10px;
    height: 10px;
    border-radius: var(--border-circle);
    position: relative;
    bottom: 13px;
    left: 83%;
}

.status-dot.online {
    background-color: var(--color-online);
}

.status-dot.offline {
    background-color: var(--color-offline);
}

.initials-input-wrapper {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.inputs-wrapper {
    display: flex;
    flex-direction: row;
    gap: 10px;
}

.chat-container {
    display: flex;
    flex-direction: column;
    gap: 10px;
    background-color: var(--chat-log-bg);
    padding: 15px;
}

.message-header {
    display: inline-flex;
    gap: 7px;
}

.message {
    display: inline-flex;
    gap: 6px;
    align-items: center;
    text-shadow: var(--text-shadow);
    color: #fff;
}

.message.admin {
    color: var(--color-admin);
}

.chat-box {
    display: flex;
    justify-content: center;
    width: 100%;
}

.chat-switcher {
    color: #fff;
    text-shadow: var(--text-shadow);
    cursor: pointer;
    user-select: none;
}

.chat-switcher.admin {
    color: var(--color-admin);
}
</style>