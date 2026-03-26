<template>
    <Transition name="modal-fade">
        <div v-if="isOpen" class="modal-overlay" @click.self="cancel">
            <div class="modal-container card glass">
                <div class="modal-header">
                    <i :class="['fa-solid', iconClass, 'modal-icon']"></i>
                    <h3>{{ title }}</h3>
                </div>

                <div class="modal-body">
                    <p>{{ message }}</p>
                </div>

                <div class="modal-footer">
                    <button class="btn-secondary" @click="cancel">Отмена</button>
                    <button :class="['btn-confirm', isDanger ? 'danger' : 'primary']" @click="confirm">
                        {{ confirmText }}
                    </button>
                </div>
            </div>
        </div>
    </Transition>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const isOpen = ref(false);
const title = ref('Подтверждение');
const message = ref('Вы уверены?');
const confirmText = ref('Да');
const isDanger = ref(false);
const iconClass = ref('fa-question-circle');

let resolvePromise: (value: boolean) => void;

const show = (options: {
    title?: string,
    message: string,
    confirmText?: string,
    type?: 'danger' | 'primary',
    icon?: string
}) => {
    title.value = options.title || 'Подтверждение';
    message.value = options.message;
    confirmText.value = options.confirmText || 'Да';
    isDanger.value = options.type === 'danger';
    iconClass.value = options.icon || (options.type === 'danger' ? 'fa-exclamation-triangle' : 'fa-question-circle');

    isOpen.value = true;
    return new Promise<boolean>((res) => {
        resolvePromise = res;
    });
};

const confirm = () => {
    isOpen.value = false;
    resolvePromise(true);
};

const cancel = () => {
    isOpen.value = false;
    resolvePromise(false);
};

defineExpose({ show });
</script>

<style scoped>
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
}

.modal-container {
    width: 90%;
    max-width: 400px;
    background: var(--card-bg);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-main);
    padding: 24px;
    box-shadow: var(--card-shadow-hover);
}

.modal-header {
    display: flex;
    color: var(--text-main);
    align-items: center;
    gap: 15px;
    margin-bottom: 15px;
}

.modal-icon {
    font-size: 1.5rem;
    color: var(--accent-blue);
}

.danger .modal-icon {
    color: var(--color-danger);
}

.modal-body p {
    color: var(--text-main);
    line-height: 1.5;
    margin-bottom: 25px;
}

.modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
}

button {
    padding: 10px 20px;
    border-radius: var(--radius-sm);
    border: none;
    font-weight: 600;
    cursor: pointer;
    transition: var(--btn-transition);
}

.btn-secondary {
    background: var(--input-bg);
    border: solid 1px var(--glass-border);
    color: var(--text-main);
}

.btn-secondary:hover {
    background: color-mix(in srgb, var(--input-bg) 50%, white 25%);
}

.btn-confirm.primary {
    background: var(--accent-blue);
    color: white;
}

.btn-confirm.primary:hover {
    background: transparent;
    outline: solid 1px var(--accent-blue);
    color: var(--accent-blue);
}

.btn-confirm.danger {
    background: var(--color-danger);
    color: white;
}

.btn-confirm.danger:hover {
    background: transparent;
    outline: solid 1px var(--color-danger);
    color: var(--color-danger);
}

.modal-fade-enter-active,
.modal-fade-leave-active {
    transition: all 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
    opacity: 0;
    transform: scale(0.9);
}
</style>