<template>
    <div class="error-page">
        <div class="error-container">
            <div class="error-card">
                <h1 class="error-code">404</h1>
                <div class="dropdown-divider"></div>
                <h2 class="error-title">Страница не найдена</h2>
                <p class="text-muted">
                    Похоже, Вы забрели куда-то не туда. <br>
                    Этой страницы больше не существует или она была перенесена.
                </p>
                <div class="actions">
                    <router-link to="/" class="btn-home">
                        <i class="fas fa-home"></i> На главную
                    </router-link>
                    <button @click="$router.go(-1)" class="btn-back">Назад</button>
                </div>
            </div>
            <div class="decoration blob-1"></div>
            <div class="decoration blob-2"></div>
        </div>
    </div>
</template>

<style scoped>
.error-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--bg-main);
    overflow: hidden;
    position: relative;
    font-family: sans-serif;
}

.error-container {
    position: relative;
    z-index: 2;
    padding: 20px;
}

.error-card {
    background: var(--glass-bg);
    backdrop-filter: var(--glass-blur);
    -webkit-backdrop-filter: var(--glass-blur);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-main);
    box-shadow: var(--card-shadow);
    padding: 40px;
    max-width: 450px;
    text-align: center;
    transition: var(--btn-transition);
}

.error-card:hover {
    box-shadow: var(--card-shadow-hover);
    transform: translateY(-4px);
}

.error-code {
    font-size: 8rem;
    font-weight: 800;
    margin: 0;
    background: linear-gradient(135deg, var(--accent-blue), var(--accent-purple));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    -webkit-user-drag: none;
    user-select: none;
    line-height: 1;
}

.error-title {
    color: var(--text-main);
    margin: 20px 0 10px;
    font-size: 1.5rem;
}

.actions {
    display: flex;
    gap: 12px;
    justify-content: center;
    margin-top: 30px;
}

.btn-home {
    background-color: var(--accent-blue);
    color: var(--text-on-dark);
    padding: 12px 24px;
    border-radius: var(--radius-sm);
    text-decoration: none;
    font-weight: 500;
    transition: var(--btn-transition);
    border: none;
    cursor: pointer;
}

.btn-home:hover {
    opacity: 0.9;
    box-shadow: 0 4px 15px rgba(52, 152, 219, 0.4);
}

.btn-back {
    background-color: var(--input-bg);
    color: var(--text-main);
    padding: 12px 24px;
    border-radius: var(--radius-sm);
    border: none;
    font-weight: 500;
    cursor: pointer;
    transition: var(--btn-transition);
}

.btn-back:hover {
    background-color: var(--input-bg-hover);
}

.decoration {
    position: absolute;
    border-radius: var(--border-circle);
    z-index: -1;
    filter: blur(60px);
    opacity: 0.4;
}

.blob-1 {
    width: 300px;
    height: 300px;
    background: var(--accent-blue);
    top: -100px;
    right: -100px;
}

.blob-2 {
    width: 250px;
    height: 250px;
    background: var(--accent-purple);
    bottom: -50px;
    left: -50px;
}

@media (max-width: 480px) {
    .error-code {
        font-size: 5rem;
    }

    .error-card {
        padding: 30px 20px;
    }

    .actions {
        flex-direction: column;
    }
}
</style>
