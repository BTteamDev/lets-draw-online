<template>
    <div class="admin-template-wrapper">
        <div class="admin-layout">
            <aside class="admin-sidebar">
                <div class="admin-logo">ADMIN</div>
                <nav>
                    <router-link to="/admin/events"><i class="fa-solid fa-list-ul"></i> Логи</router-link>
                    <router-link to="/admin/users"><i class="fa-solid fa-users"></i> Пользователи</router-link>
                    <router-link to="/" class="back-link"><i class="fa-solid fa-arrow-left"></i> На сайт</router-link>
                </nav>
            </aside>

            <main class="admin-main">
                <router-view />
            </main>
        </div>
    </div>
</template>

<style scoped>
.admin-layout {
    display: flex;
    min-height: 100vh;
    background: var(--bg-main);
    color: var(--text-main);
}

.admin-sidebar {
    width: 250px;
    background: var(--bg-accent);
    border-right: 1px solid var(--glass-border);
    padding: 20px;
}

.admin-logo {
    font-weight: bold;
    font-size: 1.2rem;
    margin-bottom: 30px;
    color: var(--accent-blue);
}

nav {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

nav a {
    color: var(--text-muted);
    text-decoration: none;
    padding: 10px;
    border-radius: 4px;
    transition: 0.3s;
}

nav a.router-link-active {
    background: var(--accent-blue);
    color: white;
}

.admin-main {
    flex: 1;
    padding: 30px;
    overflow-y: auto;
}
</style>