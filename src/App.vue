<template>
    <div class="app-container">
        <template v-if="!authState.isLoggedIn">
            <div class="auth-wrapper">
                <AuthForm />
            </div>
        </template>

        <template v-else>
            <header class="main-header">
                <router-link to="/" class="logo">
                    <i class="fa-solid fa-palette"></i>
                    <h1>Let's Draw</h1>
                </router-link>

                <nav class="main-nav">
                    <router-link v-for="link in navLinks" :key="link.path" :to="link.path" class="nav-item">
                        <i :class="link.icon"></i>
                        <span>{{ link.label }}</span>
                    </router-link>

                    <router-link v-if="isAdmin" to="/admin" class="nav-item admin-link">
                        <i class="fa-solid fa-user-shield"></i>
                        <span>Админ</span>
                    </router-link>
                </nav>

                <div class="user-actions">
                    <button @click="toggleTheme" class="theme-toggle"
                        :title="darkTheme ? 'Светлая тема' : 'Темная тема'">
                        <i v-if="darkTheme" class="fa-solid fa-sun"></i>
                        <i v-else class="fa-solid fa-moon"></i>
                    </button>
                    <router-link to="profile" class="user-brief" v-if="authState.user"
                        :title="`Профиль: ${authState.user.username}`">
                        <img :src="authState.user.avatarUrl" v-if="authState.user.avatarUrl" class="mini-avatar" />
                        <div class="mini-avatar" v-if="!authState.user.avatarUrl">{{
                            authState.user.username[0]?.toUpperCase() }}</div>
                        <span>{{ authState.user.username }}</span>
                    </router-link>
                    <button @click="logout" class="logout-btn" title="Выйти">
                        <i class="fa-solid fa-right-from-bracket"></i>
                        <span>Выход</span>
                    </button>
                </div>
            </header>

            <main class="content">
                <router-view v-slot="{ Component }">
                    <transition name="page-fade" mode="out-in">
                        <component :is="Component" />
                    </transition>
                </router-view>
            </main>
        </template>
    </div>
    <footer class="app-footer">
        <div class="container footer-content">
            <div class="footer-left">
                <a href="#" class="footer-link">Условия использования</a>
                <div class="links">
                    <span class="copyright">&copy; {{ copyDate }} Let's Draw</span>
                    <div class="divider"></div>
                    <a href="t.me/bodutop" title="Telegram" class="footer-link social"><i
                            class="fa-brands fa-telegram"></i></a>
                    <a href="vk.ru/bodutop" title="VKontakte" class="footer-link social"><i
                            class="fa-brands fa-vk"></i></a>
                    <a href="x.com/bodutop" title="Twitter (X)" class="footer-link social"><i
                            class="fa-brands fa-twitter"></i></a>
                </div>
            </div>
            <div class="footer-right">
                <span class="version-badge">Версия: {{ appVersion }}</span>
            </div>
        </div>
    </footer>
    <NotificationList />
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { authState, logout as authLogout } from '@/ts/store/auth';
import AuthForm from '@/components/auth/AuthForm.vue';
import { appVersion } from './ts/version';
import { socket } from './ts/utils/socket';
import { useNotifications } from './ts/utils/notifications';
import NotificationList from './components/notification/NotificationList.vue';

const { addNotify } = useNotifications();

const darkTheme = ref(false);
const date = new Date;
const copyDate = ref(2026 === date.getFullYear() ? 2026 : `2026-${date.getFullYear()}`);

const navLinks = [
    { path: '/', label: 'Главная', icon: 'fa-solid fa-house' },
    { path: '/about', label: 'О проекте', icon: 'fa-solid fa-circle-info' },
];

const isAdmin = computed(() => {
    const user = authState.user;
    if (!user) return false;
    const currentRole = user.systemRole || user.role;
    return ['admin', 'superadmin'].includes(currentRole);
});

const toggleTheme = () => {
    darkTheme.value = !darkTheme.value;
    const theme = darkTheme.value ? 'dark' : 'light';
    if (darkTheme.value) {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.removeAttribute('data-theme');
    }
    localStorage.setItem('theme', theme);
};

const logout = () => {
    authLogout();
};

onMounted(() => {
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme === 'dark' || (!currentTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        darkTheme.value = true;
        document.documentElement.setAttribute('data-theme', 'dark');
    }

    socket.on('user_banned_force_logout', () => {
        addNotify('error', 'Сессия завершена администратором', 10000);
        logout();
        window.location.href = `/login?error=your_account_banne?id=${authState.user._id}`;
    });
});
</script>

<style>
.page-fade-enter-active,
.page-fade-leave-active {
    transition: opacity 0.25s ease, transform 0.25s ease;
}

.page-fade-enter-from {
    opacity: 0;
    transform: translateY(10px);
}

.page-fade-leave-to {
    opacity: 0;
    transform: translateY(-10px);
}

.app-container {
    min-height: 100vh;
    background: var(--bg-main);
}

.auth-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background: var(--bg-cloud);
}

.main-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 40px;
    height: 70px;
    background: var(--header-bg);
    backdrop-filter: blur(10px);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
    position: sticky;
    top: 0;
    z-index: 1000;
    border-bottom: 1px solid var(--glass-border);
}

.main-nav {
    display: flex;
    gap: 8px;
    align-items: center;
}

.nav-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    color: var(--text-muted);
    text-decoration: none;
    border-radius: var(--radius-sm);
    font-weight: 500;
    font-size: 0.95rem;
    transition: var(--btn-transition);
}

.nav-item i {
    font-size: 1.1rem;
}

.nav-item:hover {
    background: var(--glass-bg);
    color: var(--accent-blue);
}

.router-link-active {
    background: var(--glass-bg);
    color: var(--accent-blue);
    box-shadow: inset 0 -2px 0 var(--accent-blue);
    border-radius: var(--radius-sm) var(--radius-sm) 0 0;
}

.admin-link:hover {
    color: var(--color-admin);
}

.logo {
    display: flex;
    align-items: center;
    gap: 12px;
    text-decoration: none;
    color: var(--text-main);
    transition: var(--btn-transition);
    user-select: none;
}

.logo:hover {
    transform: scale(1.02);
}

.logo i {
    font-size: 1.8rem;
    color: var(--accent-blue);
}

.logo h1 {
    font-size: 1.4rem;
    font-weight: 800;
    margin: 0;
    letter-spacing: -0.5px;
}

.user-actions {
    display: flex;
    align-items: center;
    gap: 20px;
}

.theme-toggle {
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    color: var(--accent-blue);
    width: 38px;
    height: 38px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.1rem;
    transition: var(--btn-transition);
    margin-right: 8px;
}

.theme-toggle:hover {
    background: var(--bg-accent);
    transform: translateY(-1px);
    box-shadow: var(--card-shadow);
}

.user-brief {
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: 600;
    color: var(--text-main);
    text-decoration: none;
    animation: cubic-bezier(0.075, 0.82, 0.165, 1);
    transition: 250ms;
    user-select: none;
}

.user-brief:hover {
    transform: scale(1.1);
    margin-bottom: 5px;
}

.mini-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid var(--glass-border);
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: var(--accent-blue);
    color: white;


}

.logout-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--input-bg);
    color: var(--text-main);
    border: none;
    padding: 8px 16px;
    border-radius: var(--radius-sm);
    font-weight: 600;
    cursor: pointer;
    transition: var(--btn-transition);
}

.logout-btn:hover {
    background: var(--color-danger);
    color: white;
}

.app-wrapper {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
}

.main-content {
    flex: 1;
}

.app-footer {
    margin-top: auto;
    padding: 20px 0;
    background: rgba(255, 255, 255, 0.03);
    border-top: 1px solid var(--glass-border);
    backdrop-filter: blur(10px);
}

.footer-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.footer-link {
    color: var(--text-muted);
    text-decoration: none;
    font-size: 0.9rem;
    font-weight: 500;
    transition: color 0.3s ease;
    margin-left: 30px;
}

.copyright {
    color: var(--text-muted);
}

.links {
    display: inline-flex;
    margin-top: 10px;
    margin-left: 30px;
    align-items: center;
    gap: 10px;
}

.divider {
    width: 1px;
    height: 15px;
    background-color: var(--text-muted);
}

.footer-left {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
}

.social {
    margin: 0;
}

.footer-link:hover {
    color: var(--accent-blue);
    text-decoration: underline;
}

.version-badge {
    color: var(--text-muted);
    font-size: 0.85rem;
    font-family: 'Monaco', 'Consolas', monospace;
    background: rgba(255, 255, 255, 0.05);
    padding: 4px 10px;
    border-radius: 6px;
    border: 1px solid var(--glass-border);
    margin-right: 30px;
}

fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

@media (max-width: 768px) {
    .main-header {
        padding: 0 15px;
        height: 60px;
    }

    .logo h1 {
        display: none;
    }

    .nav-item span,
    .logout-btn span {
        display: none;
    }

    .nav-item {
        padding: 8px 12px;
    }

    .main-nav {
        gap: 4px;
    }

    .user-actions {
        gap: 10px;
    }

    .user-brief span {
        display: none;
    }
}

@media (max-width: 480px) {
    .footer-content {
        flex-direction: column;
        gap: 15px;
        padding: 20px 0;
    }

    .footer-left {
        align-items: center;
    }

    .footer-link,
    .links {
        margin-left: 0;
    }

    .version-badge {
        margin-right: 0;
    }

    .nav-item i,
    .theme-toggle,
    .logout-btn i {
        font-size: 1.3rem;
    }
}
</style>