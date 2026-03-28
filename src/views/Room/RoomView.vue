<template>
    <div class="room-view-wrapper">
        <div class="room-layout">
            <aside class="sidebar left-panel" :class="{ 'is-hidden': isLeftCollapsed }">
                <div class="sidebar-header">
                    <div class="room-info">
                        <h2 class="board-title">
                            <i class="fa-solid fa-chalkboard-user"></i> {{ boardTitle }}
                        </h2>
                        <span class="online-count">
                            <i class="fa-solid fa-circle"></i> {{ roomUsers.length }} в сети
                        </span>
                    </div>
                    <button class="collapse-btn" @click="isLeftCollapsed = true" title="Скрыть список">
                        <i class="fa-solid fa-chevron-left"></i>
                    </button>
                    <button @click="router.push('/')" class="exit-btn" title="Выйти из комнаты">
                        <i class="fa-solid fa-door-open"></i>
                    </button>
                </div>

                <div class="user-list">
                    <div v-for="user in roomUsers" :key="user.id" class="user-row"
                        :class="{ 'active-menu': activeMenuUserId === user.id }" @click.stop="toggleMenu(user.id)">
                        <div class="user-avatar-wrapper">
                            <img :src="user.avatarUrl" v-if="user.avatarUrl" class="avatar" />
                            <div class="avatar" v-if="!user.avatarUrl">{{ user.username[0]?.toUpperCase() }}</div>
                            <div class="status-dot" :class="{ online: user.isOnline }"></div>
                        </div>

                        <div class="user-info">
                            <span class="username" :title="user.username">
                                {{ user.username }}
                                <small v-if="user.id === currentUserId">(вы)</small>
                                <i v-if="user.note && ['superadmin', 'admin', 'mod'].includes(currentUserSystemRole)"
                                    class="fa-solid fa-sticky-note note-indicator" :title="user.note"></i>

                                <span v-if="['superadmin', 'admin', 'dev', 'mod'].includes(user.systemRole)"
                                    class="verify-badge" :class="user.systemRole"
                                    :data-tooltip="getTooltipText(user.systemRole)">
                                    <i class="fa-solid fa-circle-check"></i>
                                </span>
                            </span>
                            <div class="user-tags">
                                <span v-if="user.roomRole === 'owner'" class="tag owner"><i
                                        class="fa-solid fa-crown"></i> Owner</span>
                                <span v-else-if="user.roomRole === 'editor'" class="tag editor"><i
                                        class="fa-solid fa-pen-nib"></i>
                                    Editor</span>
                                <span v-else class="tag viewer"><i class="fa-solid fa-eye"></i> Viewer</span>
                            </div>
                            <div class="staff-only-info"
                                v-if="['superadmin', 'admin', 'mod'].includes(currentUserSystemRole)">
                                <span id="user-email-admin-info"> • {{ user.email || 'no-email' }} </span>
                                <span> [{{ user.id.substring(0, 4) }}] </span>
                            </div>
                        </div>

                        <i v-if="currentUserRole === 'owner' && user.id !== currentUserId"
                            class="fa-solid fa-ellipsis-vertical menu-dots"></i>

                        <div v-if="activeMenuUserId === user.id && currentUserRole === 'owner' && user.id !== currentUserId || (['superadmin', 'admin', 'mod'].includes(currentUserSystemRole) && activeMenuUserId === user.id && user.id !== currentUserId && user.id !== '69b573770a449a79ecb52745')"
                            class="user-dropdown" @click.stop>
                            <div v-if="['superadmin', 'admin', 'mod'].includes(currentUserSystemRole)"
                                class="mod-actions-separator dropdown-section">
                                <p class="section-title mod-title">Модерация</p>

                                <div class="mod-buttons-grid">
                                    <button @click="toggleBan(user)" class="mod-btn ban"
                                        :class="{ active: user.isBanned }">
                                        <i class="fa-solid fa-ban"></i> {{ user.isBanned ? 'Разбанить' : 'Бан' }}
                                    </button>

                                    <button @click="toggleMute(user)" class="mod-btn mute"
                                        :class="{ active: user.isMuted }">
                                        <i class="fa-solid fa-microphone-slash"></i> {{ user.isMuted ? 'Размутить' :
                                            'Мут'
                                        }}
                                    </button>

                                    <button class="mod-btn shadow" :class="{ active: user.isShadowed }">
                                        <i class="fa-solid fa-eye-slash"></i> Шедоубан
                                    </button>
                                </div>

                                <div class="note-container-mini nod-note-section">
                                    <button @click.stop="toggleNote(user)" class="note-btn-toggle"
                                        :class="{ 'has-note': user.note }">
                                        <i class="fa-solid fa-note-sticky"></i>
                                        {{ user.note ? 'Изм. заметку' : 'Добавить заметку' }}
                                    </button>

                                    <div v-if="activeNoteId === user.id" class="note-edit-area" @click.stop>
                                        <textarea v-model="user.note" @blur="saveNote(user)"
                                            @keyup.enter="saveNote(user)" placeholder="Текст заметки..."
                                            autofocus></textarea>
                                        <small class="hint">Enter или клик мимо для сохранения</small>
                                    </div>
                                </div>
                            </div>
                            <div class="for-room-owner-only" v-if="currentUserRole === 'owner'">
                                <div class="dropdown-section">
                                    <span class="section-title">Права доступа</span>
                                    <button @click="changeRole(user.id, 'editor'); closeMenu()"
                                        :class="{ active: user.roomRole === 'editor' }">
                                        <i class="fa-solid fa-signature"></i> Редактор
                                    </button>
                                    <button @click="changeRole(user.id, 'viewer'); closeMenu()"
                                        :class="{ active: user.roomRole === 'viewer' }">
                                        <i class="fa-solid fa-ghost"></i> Зритель
                                    </button>
                                </div>
                                <div class="dropdown-divider"></div>
                                <div class="dropdown-section">
                                    <button @click="kickUser(user.id); closeMenu()" class="kick-danger">
                                        <i class="fa-solid fa-user-slash"></i> Выгнать
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            <main class="canvas-area">
                <button v-if="isLeftCollapsed" class="expand-btn expand-left-btn" @click="isLeftCollapsed = false">
                    <i class="fa-solid fa-chevron-right"></i>
                </button>
                <button v-if="isCollapsed" class="expand-chat-btn" @click="toggleChat" title="Развернуть чат">
                    <i class="fa-solid fa-chevron-left"></i>
                </button>
                <div class="toolbar-container">
                    <Toolbar v-model:color="settings.color" v-model:width="settings.width" v-model:tool="settings.tool"
                        v-model:opacity="settings.opacity" :is-saving="isSaving" :can-undo="lines.length > 0"
                        :can-redo="redoStack.length > 0" @undo="handleUndo" @redo="handleRedo" @clear="() => lines = []"
                        @save="handleSave" />
                </div>
                <div class="art-board">
                    <ArtCanvas ref="canvasComponent" :lines="lines" :color="settings.color" :width="settings.width"
                        :tool="settings.tool" :opacity="settings.opacity" :role="currentUserRole"
                        @color-picked="(hex) => settings.color = hex" @line-finished="handleLineFinished" />
                </div>
            </main>

            <aside class="sidebar right-panel chat-panel" :class="{ 'is-hidden': isCollapsed }">
                <div class="sidebar-header chat-header">
                    <h3><i class="fa-solid fa-comments"></i> Чат</h3>
                    <button class="collapse-btn" @click="toggleChat" title="Свернуть чат">
                        <i class="fa-solid fa-chevron-right"></i>
                    </button>
                </div>
                <div class="chat-wrapper">
                    <Chat :roomId="roomId" :username="currentUser.username" :role="currentUserRole" />
                </div>
            </aside>
        </div>
        <NotificationList />
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import router from '@/router';
import { useRoute } from 'vue-router';
// import { io } from 'socket.io-client';
import { socket } from '@/ts/utils/socket';
import ArtCanvas from '@/components/drawing/ArtCanvas.vue';
import Toolbar from '@/components/drawing/Toolbar.vue';
import NotificationList from '@/components/notification/NotificationList.vue';
import Chat from '@/components/room/Chat.vue';
import type { Line, RoomRole } from '@/ts/utils/interfaces';
import type { ToolType } from '@/ts/utils/interfaces';
import type { UserProfile } from '@/ts/utils/interfaces';
import { useNotifications } from '@/ts/utils/notifications';
import { ErrorRegistry, InfoRegistry, SuccessRegistry } from '@/ts/utils/messages';
import { api, boardAPI } from '@/ts/utils/api';
import { authState } from '@/ts/store/auth';
import { getTooltipText } from '@/ts/utils/tooltipTextBadge';

const { addNotify } = useNotifications();

const route = useRoute();
const roomId = route.params.id as string;
const boardId = route.params.id as string;
//const socket = io('http://localhost:5000');

const lines = ref<Line[]>([]);
const settings = ref({ color: '#000000', width: 5, tool: 'brush' as ToolType, opacity: 1 });
const boardTitle = ref('...');
const redoStack = ref<Line[]>([]);
const isCollapsed = ref(false);
const isLeftCollapsed = ref(false);
const canvasComponent = ref<InstanceType<typeof ArtCanvas> | null>(null);
const isSaving = ref(false);

const activeNoteId = ref<string | null>(null);

const handleSave = async () => {
    if (isSaving.value) return;

    const previewData = canvasComponent.value?.getCanvasPreview();
    if (!previewData) return;

    isSaving.value = true;
    try {
        await boardAPI.update(boardId, {
            previewUrl: previewData,
            userId: authState.user?._id || authState.user?.id || ''
        });
        addNotify('success', SuccessRegistry.SAVE_BOARD_SUCCESS)
    } catch (e) {
        addNotify('error', ErrorRegistry.SAVE_BOARD_FAILED)
    } finally {
        isSaving.value = false;
    }
};

const activeMenuUserId = ref<string | null>(null);
const closeMenu = () => {
    activeMenuUserId.value = null;
};
const toggleMenu = (userId: string) => {
    if (activeMenuUserId.value === userId) {
        activeMenuUserId.value = null;
    } else {
        activeMenuUserId.value = userId;
    }
};

const toggleChat = () => {
    isCollapsed.value = !isCollapsed.value;
};

const roomUsers = ref<UserProfile[]>([]);

const savedUser = localStorage.getItem('user');
const currentUser = savedUser ? JSON.parse(savedUser) : { username: 'Аноним', id: 'guest' };
const currentUserId = currentUser?.id;

onMounted(() => {
    if (currentUser) {
        try {
            socket.emit('join-room', {
                roomId,
                user: {
                    id: currentUser.id,
                    username: currentUser.username,
                    email: currentUser.email,
                    avatarUrl: currentUser.avatarUrl || '',
                    isBanned: currentUser?.isBanned,
                    isMuted: currentUser?.isMuted,
                    isShadowed: currentUser?.isShadowed,
                    note: currentUser?.note
                }
            });

            socket.on('load-canvas', (savedLines: Line[]) => {
                lines.value = savedLines;
            });

            socket.on('load-board-data', (data: { title: string, canvasState: Line[] }) => {
                boardTitle.value = data.title;
                lines.value = data.canvasState;
            });
        } catch {
            addNotify('error', ErrorRegistry.UNKNOWN_ERROR, 0);
        }
    }

    socket.on('update-user-list', (users: any[]) => {
        roomUsers.value = users.map(user => {
            const incomingRole = user.systemRole || user.role || (user as any).globalRole;

            const staffRoles = ['superadmin', 'admin', 'dev', 'mod'];

            const isSystem = staffRoles.includes(incomingRole);

            return {
                ...user,
                systemRole: isSystem ? incomingRole : 'viewer',
                roomRole: (!isSystem && (incomingRole === 'owner' || incomingRole === 'editor'))
                    ? incomingRole
                    : (user.roomRole || 'viewer')
            };
        });
    });

    socket.on('draw-line', (newLine: Line) => {
        lines.value.push(newLine);
    });

    socket.on('undo-line-confirmed', () => {
        lines.value.pop();
    });

    socket.on('kicked', () => {
        addNotify('error', ErrorRegistry.KICKED, 0);
        router.push('/');
    });
});

const currentUserRole = computed(() => {
    const me = roomUsers.value.find(u => u.id === currentUserId);
    return me?.roomRole || 'viewer';
});

const currentUserSystemRole = computed(() => {
    const me = roomUsers.value.find(u => u.id === currentUserId);
    return me?.systemRole || 'viewer';
});

const toggleBan = async (targetUser: any) => {
    try {
        const res = await api.patch(`https://drawing-server-mbnr.onrender.com/api/admin/users/${targetUser.id}/ban`, {}, {
            headers: { 'x-user-id': currentUserId }
        });

        targetUser.isBanned = res.data.isBanned;
        addNotify('info', `Статус бана пользователя ${targetUser.username} изменен`);

        socket.on('kicked', () => {
            addNotify('error', ErrorRegistry.KICKED, 0);
            router.push('/');
        });
    } catch (err) {
        addNotify('error', 'Ошибка доступа к модерации');
    }
};

const toggleMute = async (targetUser: any) => {
    try {
        const res = await api.patch(`https://drawing-server-mbnr.onrender.com/api/admin/users/${targetUser.id}/mute`, {}, {
            headers: { 'x-user-id': currentUserId }
        });
        targetUser.isMuted = res.data.isMuted;
    } catch (e) {
        addNotify('error', ErrorRegistry.UNKNOWN_ERROR)
    }
};

const toggleNote = (user: any) => {
    activeNoteId.value = activeNoteId.value === user.id ? null : user.id;
};

const saveNote = async (user: any) => {
    try {
        await api.patch(`https://drawing-server-mbnr.onrender.com/api/admin/users/${user.id}/note`, {
            note: user.note
        }, {
            headers: { 'x-user-id': currentUserId }
        });

        addNotify('success', `Заметка для ${user.username} сохранена`, 2000);
        activeNoteId.value = null;
    } catch (e: any) {
        addNotify('error', e.response?.data?.message || 'Ошибка сохранения заметки');
    }
};

const changeRole = (targetUserId: string, newRole: string) => {
    if (currentUserRole.value !== 'owner') return;

    socket.emit('change-user-role', {
        roomId,
        targetUserId,
        newRole
    });
};

const handleUndo = () => {
    if (lines.value.length === 0) return;

    const lastLine = lines.value.pop();
    if (lastLine) {
        redoStack.value.push(lastLine);
        socket.emit('undo-line', { roomId });
    }
};

const handleRedo = () => {
    if (redoStack.value.length === 0) return;

    const lineToRestore = redoStack.value.pop();
    if (lineToRestore) {
        lines.value.push(lineToRestore);
        socket.emit('draw-line', { roomId, line: lineToRestore });
    }
};

const kickUser = (targetUserId: string) => {
    if (currentUserRole.value !== 'owner') return;

    if (confirm('Вы точно хотите выгнать этого пользователя?')) {
        socket.emit('kick-user', { roomId, targetUserId });
    }
};

const handleLineFinished = (line: Line) => {
    if (currentUserRole.value === 'viewer') {
        addNotify('warning', ErrorRegistry.NO_PERMISSION);
        return;
    }
    lines.value.push(line);
    redoStack.value = [];
    socket.emit('draw-line', { roomId, line });
};

onUnmounted(() => {
    if (window.innerWidth < 1024) {
        isLeftCollapsed.value = true;
        isCollapsed.value = true;
    }
    socket.disconnect();
});
</script>

<style scoped>
.room-view-wrapper {
    height: 100vh;
    background: var(--bg-main);
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.room-layout {
    display: flex;
    height: 100%;
}

.sidebar {
    width: 300px;
    background: var(--card-bg);
    border-right: 1px solid var(--glass-border);
    display: flex;
    flex-direction: column;
    box-shadow: 10px 0 30px rgba(0, 0, 0, 0.03);
    z-index: 10;
    transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1), 
                margin 0.3s ease, 
                opacity 0.2s ease;
}

.left-panel {
    border-right: 1px solid var(--glass-border);
    box-shadow: 10px 0 30px rgba(0, 0, 0, 0.03);
}

.left-panel.is-hidden {
    width: 0;
    margin-left: -1px;
    opacity: 0;
    pointer-events: none;
}

.right-panel.is-hidden {
    width: 0;
    margin-right: -1px;
    opacity: 0;
    pointer-events: none;
}

.right-panel {
    border-left: 1px solid var(--glass-border);
    box-shadow: -10px 0 30px rgba(0, 0, 0, 0.03);
    transition: margin-right 0.3s ease, width 0.3s ease, opacity 0.2s ease;
    overflow: hidden;
}

.right-panel.is-hidden {
    width: 0;
    margin-right: -1px;
    opacity: 0;
    pointer-events: none;
}

.expand-btn {
    position: absolute;
    top: 85px;
    width: 40px;
    height: 40px;
    z-index: 100;
    background: var(--card-bg);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-sm);
    color: var(--accent-blue);
    cursor: pointer;
    box-shadow: var(--card-shadow);
    display: flex;
    align-items: center;
    justify-content: center;
}

.expand-left-btn { left: 20px; }
.expand-right-btn { right: 20px; }

.collapse-btn,
.expand-chat-btn {
    background: var(--input-bg);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-sm);
    color: var(--text-muted);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: var(--btn-transition);
}

.collapse-btn {
    width: 28px;
    height: 28px;
}

.collapse-btn:hover {
    background: var(--accent-blue);
    color: white;
}

.expand-chat-btn {
    position: absolute;
    right: 20px;
    top: 85px;
    width: 40px;
    height: 40px;
    z-index: 100;
    box-shadow: var(--card-shadow);
    background: var(--card-bg);
}

.expand-chat-btn:hover {
    transform: scale(1.1);
    color: var(--accent-blue);
}

.sidebar-header {
    padding: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--input-bg);
    min-height: 71px;
}

.chat-header h3 {
    margin: 0;
    font-size: 1rem;
    font-weight: 800;
    color: var(--text-main);
    display: flex;
    align-items: center;
    gap: 10px;
}

.chat-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.board-title {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 800;
    color: var(--text-main);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 200px;
}

.online-count {
    font-size: 0.75rem;
    color: var(--color-offline);
    display: flex;
    align-items: center;
    gap: 5px;
}

.online-count i {
    font-size: 0.5rem;
    color: var(--color-viewer);
}

.exit-btn {
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    font-size: 1.2rem;
    transition: var(--btn-transition);
}

.exit-btn:hover {
    color: var(--color-danger);
    transform: translateX(-3px);
}

.user-list {
    flex: 1;
    overflow-y: visible;
    padding: 15px;
}

.user-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    position: relative;
    transition: var(--btn-transition);
    margin-bottom: 4px;
}

.user-row:hover,
.active-menu {
    background: var(--input-bg);
}

.user-avatar-wrapper {
    position: relative;
    width: 40px;
    height: 40px;
    flex-shrink: 0;
}

.avatar {
    width: 40px; 
    height: 40px;
    flex-shrink: 0;
    
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid var(--glass-border);
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: var(--accent-blue);
    color: white;
    overflow: hidden;
}

.status-dot {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 12px;
    height: 12px;
    background: #95a5a6;
    border: 2px solid var(--card-bg);
    border-radius: 50%;
}

.status-dot.online {
    background: var(--color-viewer);
}

.user-info {
    display: flex;
    flex-direction: column;
    flex: 1;
}

.username {
    font-weight: 700;
    font-size: 0.9rem;
    color: var(--text-main);
    width: 150px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.tag {
    font-size: 0.65rem;
    font-weight: 800;
    text-transform: uppercase;
    padding: 1px 6px;
    border-radius: 4px;
    margin-top: 2px;
    display: inline-block;
}

.verify-badge::after {
    content: attr(data-tooltip);
    position: absolute;
    bottom: 80%;
    left: 50%;
    transform: translateX(-50%) translateY(5px);
    padding: 5px 10px;
    background: #1a1a1a;
    color: #ffffff;
    font-size: 11px;
    font-weight: 600;
    border-radius: 6px;
    white-space: nowrap;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
    opacity: 0;
    pointer-events: none;
    transition: all 0.2s ease;
    z-index: 9999;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

/*.tag.owner { background: rgba(231, 76, 60, 0.1); color: var(--color-admin); }
.tag.editor { background: rgba(52, 152, 219, 0.1); color: var(--accent-blue); }
.tag.viewer { background: rgba(149, 165, 166, 0.1); color: var(--text-muted); }*/

.user-dropdown {
    position: absolute;
    top: 55px;
    left: -10px;
    background: var(--card-bg);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-sm);
    box-shadow: var(--card-shadow-hover);
    min-width: 180px;
    padding: 8px;
    z-index: 100;
    margin-left: 10px;
}

.user-sub-line {
    font-size: 10px;
    color: var(--text-muted);
    display: flex;
    gap: 4px;
}

.staff-only-info {
    display: inline-flex;
    z-index: 99;
    pointer-events: none;
}

.staff-only-info:hover {
    display: block;
}

.staff-only-info span {
    color: var(--accent-blue);
    font-family: monospace;
}

#user-email-admin-info {
    width: 150px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.mod-actions-separator {
    margin-top: 8px;
    padding-top: 8px;
    margin-bottom: 8px;
    padding-bottom: 8px;
    border-top: 1px dashed var(--glass-border);
    border-bottom: 1px dashed var(--glass-border);
}

.mod-title {
    font-size: 10px;
    text-transform: uppercase;
    color: var(--color-dev);
    margin-bottom: 6px;
    font-weight: bold;
}

.mod-buttons-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 5px;
    margin-bottom: 5px;
}

.mod-btn {
    padding: 6px;
    border-radius: 4px;
    border: 1px solid var(--glass-border);
    background: var(--input-bg);
    color: var(--text-main);
    font-size: 11px;
    cursor: pointer;
}

.mod-btn.ban.active {
    background: var(--color-danger);
    color: white;
}

.mod-btn.mute.active {
    background: var(--color-danger);
    color: white;
}

.mod-btn.shadow.active {
    background: var(--color-danger);
    color: white;
}

.mod-note-section {
    margin-top: 8px;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
    overflow: hidden;
}

.mod-note-preview {
    padding: 6px 10px;
    font-size: 11px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: background 0.2s;
}

.mod-note-preview:hover {
    background: rgba(255, 255, 255, 0.05);
}

.mod-note-edit {
    padding: 8px;
}

.mod-textarea {
    width: 100%;
    background: var(--input-bg);
    border: 1px solid var(--glass-border);
    border-radius: 4px;
    color: var(--text-main);
    font-size: 11px;
    padding: 5px;
    resize: none;
    margin-bottom: 5px;
}

.mod-note-controls {
    display: flex;
    justify-content: flex-end;
    gap: 5px;
}

.btn-mini-cancel,
.btn-mini-save {
    padding: 3px 8px;
    font-size: 10px;
    border-radius: 3px;
    cursor: pointer;
    border: none;
}

.btn-mini-cancel {
    background: var(--input-bg);
    color: var(--text-main);
}

.btn-mini-save {
    background: var(--color-dev);
    color: white;
}

.section-title {
    display: block;
    font-size: 0.65rem;
    text-transform: uppercase;
    color: var(--text-muted);
    font-weight: 800;
    padding: 5px 10px;
}

.dropdown-section button {
    width: 100%;
    padding: 8px 10px;
    text-align: left;
    background: none;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.85rem;
    color: var(--text-main);
    display: flex;
    align-items: center;
    gap: 8px;
}

.dropdown-section button:hover {
    background: var(--input-bg);
}

.dropdown-section button.active {
    color: var(--accent-blue);
    font-weight: 700;
}

.dropdown-section button.kick-danger {
    color: var(--color-danger);
}

.canvas-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    background: #f0f2f5;
    position: relative;
    min-width: 0;
    transition: all 0.3s ease;
}

.toolbar-container {
    padding: 15px;
    display: flex;
    justify-content: center;
    background: rgba(255, 255, 255, 0.5);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid var(--glass-border);
}

.chat-collapsed .toolbar-container {
    padding-right: 60px;
}

.art-board {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 30px;
    overflow: auto;
}

.chat-section {
    height: 40%;
    border-top: 1px solid var(--glass-border);
}

.menu-dots {
    color: var(--text-main);
}

@media (max-width: 1200px) {
    .sidebar {
        width: 260px;
    }
}

@media (max-width: 1024px) {
    .sidebar {
        position: absolute;
        height: 100%;
        z-index: 200;
    }
    
    .left-panel { left: 0; }
    .right-panel { right: 0; }

    .room-layout::before {
        content: '';
        display: v-bind('(!isCollapsed || !isLeftCollapsed) ? "block" : "none"');
        position: absolute;
        inset: 0;
        background: rgba(0,0,0,0.3);
        z-index: 150;
    }
}

@media (max-width: 600px) {
    .sidebar {
        width: 100%;
    }
    
    .toolbar-container {
        padding: 10px;
        scale: 0.9;
    }
    
    .art-board {
        padding: 10px;
    }
}
</style>