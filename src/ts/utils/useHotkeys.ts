import { onMounted, onUnmounted } from 'vue';

type HotkeyMap = {
    [key: string]: (e: KeyboardEvent) => void;
};

export function useHotkeys(hotkeys: HotkeyMap) {
    const handler = (e: KeyboardEvent) => {
        const tag = (e.target as HTMLElement).tagName.toLowerCase();
        if (tag === 'input' || tag === 'textarea') return;

        const combo = [
            e.ctrlKey && 'ctrl',
            e.metaKey && 'meta',
            e.shiftKey && 'shift',
            e.altKey && 'alt',
            e.key.toLowerCase()
        ].filter(Boolean).join('+');

        const fn = hotkeys[combo];
        if (fn) {
            e.preventDefault();
            fn(e);
        }
    };

    onMounted(() => window.addEventListener('keydown', handler));
    onUnmounted(() => window.removeEventListener('keydown', handler));
}