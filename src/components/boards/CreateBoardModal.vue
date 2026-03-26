<template>
    <div class="create-board-modal-template-wrapper">
        <div class="modal-overlay" @click.self="emit('close')">
            <div class="modal-content">
                <div class="modal-header">
                    <h2><i class="fa-solid fa-square-plus"></i> Новая доска</h2>
                    <button class="close-x" @click="emit('close')"><i class="fa-solid fa-xmark"></i></button>
                </div>

                <div class="form-group">
                    <label><i class="fa-solid fa-signature"></i> Название</label>
                    <input class="input-modal" v-model="title" placeholder="Как назовем шедевр?"
                        :disabled="isSubmitting" @keyup.enter="handleCreate" />
                </div>

                <div class="form-group checkbox">
                    <div class="custom-checkbox">
                        <input type="checkbox" id="private" v-model="isPrivate" />
                        <label for="private">
                            <i :class="isPrivate ? 'fa-solid fa-lock' : 'fa-solid fa-lock-open'"></i>
                            Приватная доска (только для Вас)
                        </label>
                    </div>
                </div>

                <div class="actions">
                    <button @click="emit('close')" class="cancel-btn">
                        Отмена
                    </button>
                    <button @click="handleCreate" class="confirm-btn" :disabled="!title || isSubmitting">
                        <i v-if="isSubmitting" class="fa-solid fa-spinner fa-spin"></i>
                        <i v-else class="fa-solid fa-check"></i>
                        {{ isSubmitting ? 'Создаем...' : 'Создать' }}
                    </button>
                </div>
            </div>
        </div>
        <NotificationList />
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { boardAPI } from '@/ts/utils/api';
import { useNotifications } from '@/ts/utils/notifications';
import { ErrorRegistry } from '@/ts/utils/messages';
import NotificationList from '../notification/NotificationList.vue';

const { addNotify } = useNotifications();

const emit = defineEmits(['close', 'created']);
const title = ref('');
const isPrivate = ref(false);
const isSubmitting = ref(false);

const handleCreate = async () => {
    if (!title.value.trim()) {
        addNotify('error', ErrorRegistry.NOT_ALLOWED, 0);
        return;
    };
    isSubmitting.value = true;

    try {
        const savedUser = localStorage.getItem('user');
        const user = savedUser ? JSON.parse(savedUser) : null;

        if (!user || !user.id) {
            addNotify('error', ErrorRegistry.USER_ID_NOT_FOUND, 0);
            return;
        }

        await boardAPI.create({
            title: title.value,
            isPrivate: isPrivate.value,
            userId: user.id
        });

        emit('created');
        emit('close');
    } catch (e) {
        addNotify('error', ErrorRegistry.UNKNOWN_ERROR, 0);
    } finally {
        isSubmitting.value = false;
    }
};
</script>

<style scoped>
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(4px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.modal-content {
    background: var(--card-bg);
    padding: 32px;
    border-radius: var(--radius-main);
    width: 440px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
    border: 1px solid var(--glass-border);
    position: relative;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
}

.modal-header h2 {
    margin: 0;
    font-size: 1.4rem;
    color: var(--text-main);
    display: flex;
    align-items: center;
    gap: 12px;
}

.modal-header h2 i {
    color: var(--accent-blue);
}

.input-modal {
    width: 100%;
    padding: 7px 7px;
    background-color: var(--input-bg);
    border: 2px solid transparent;
    border-radius: var(--radius-sm);
    font-size: 1rem;
    color: var(--text-main);
    transition: var(--btn-transition);
}

.close-x {
    background: none;
    border: none;
    font-size: 1.2rem;
    color: var(--text-muted);
    cursor: pointer;
    transition: var(--btn-transition);
}

.close-x:hover {
    color: var(--color-danger);
    transform: rotate(90deg);
}

.form-group {
    margin-bottom: 24px;
    display: flex;
    flex-direction: column;
}

.form-group label {
    margin-bottom: 8px;
    font-weight: 600;
    font-size: 0.9rem;
    color: var(--text-main);
    display: flex;
    align-items: center;
    gap: 8px;
}

.form-group input[type="text"] {
    width: 100%;
    padding: 12px 16px;
    background: var(--input-bg);
    border: 2px solid transparent;
    border-radius: var(--radius-sm);
    font-size: 1rem;
    transition: var(--btn-transition);
}

.form-group input:focus {
    outline: none;
    border-color: var(--accent-blue);
    background: var(--card-bg);
    box-shadow: 0 0 0 4px rgba(52, 152, 219, 0.1);
}

.form-group.checkbox {
    flex-direction: row;
    align-items: center;
}

.custom-checkbox {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
}

.custom-checkbox input {
    width: 18px;
    height: 18px;
    cursor: pointer;
    accent-color: var(--accent-blue);
}

.custom-checkbox label {
    margin: 0;
    cursor: pointer;
    font-weight: 500;
    user-select: none;
}

.actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 8px;
}

.cancel-btn {
    background: var(--input-bg);
    color: var(--text-main);
    border: none;
    padding: 12px 20px;
    border-radius: var(--radius-sm);
    font-weight: 600;
    cursor: pointer;
    transition: var(--btn-transition);
}

.cancel-btn:hover {
    background: #e2e8f0;
}

.confirm-btn {
    background: var(--accent-blue);
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: var(--radius-sm);
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: var(--btn-transition);
}

.confirm-btn:hover:not(:disabled) {
    background: var(--accent-purple);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(155, 89, 182, 0.3);
}

.confirm-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}
</style>