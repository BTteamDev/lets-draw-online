<template>
    <div class="about-page">
        <div class="about-main">
            <section class="card glass section-card">
                <h1 class="section-title">
                    <i class="fa-solid fa-circle-info"></i> О проекте
                </h1>
                <p class="description-text">
                    Площадка для рисования вместе онлайн. Заходи, рисуй, общайся, сохраняй свои шедевры!
                    Мы создали пространство, где творчество не знает границ, а каждый пиксель передается мгновенно.
                </p>
            </section>

            <section class="card glass section-card">
                <h1 class="section-title">
                    <i class="fa-solid fa-microchip"></i> Технологии
                </h1>
                <div class="tech-stack">
                    <p>
                        Вся платформа написана на
                        <a href="https://www.typescriptlang.org/" target="_blank" class="tech-link ts">TypeScript</a>.
                    </p>
                    <p>
                        Серверный код запущен на <strong>Node.js</strong> сервере с использованием
                        <a href="https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API" target="_blank"
                            class="tech-link ws">WebSockets</a>
                        для мгновенной связи между художниками.
                    </p>
                    <p>
                        Интерфейс создан с использованием современного фреймворка
                        <span class="tech-tag vue">VueJS</span>.
                    </p>
                </div>
            </section>

            <section class="card glass section-card">
                <h1 class="section-title">
                    <i class="fa-solid fa-users"></i> Команда
                </h1>
                <div class="team-grid" v-if="members.length > 0">
                    <div v-for="member in members" :key="member.userId" class="member-card">
                        <img :src="member.avatarUrl" class="member-avatar" alt="Avatar">
                        <div class="member-info">
                            <h3 class="member-name" :title="member.username">{{ member.username }}</h3>
                            <p class="member-position">{{ member.position }}</p>
                            <div class="member-socials">
                                <a v-for="social in member.socials" :key="social.url" :href="social.url" target="_blank"
                                    :title="social.label" class="social-link">
                                    <i :class="social.icon"></i>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                <div v-else class="empty-placeholder">
                    <i class="fa-solid fa-spinner fa-spin"></i>
                    <p>Загрузка команды...</p>
                </div>
            </section>
        </div>

        <aside class="about-sidebar">
            <section class="card glass section-card full-height">
                <h1 class="section-title">
                    <i class="fa-solid fa-clock-rotate-left"></i> Журнал изменений
                </h1>
                <div class="changelog-content" v-html="changelogHtml"></div>
            </section>
        </aside>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { credits, type CreditMember } from '@/ts/credits';
import { userAPI } from '@/ts/utils/api';
import { marked } from 'marked';

const changelogHtml = ref('');
const changelogRaw = ref('');
// const parseChangelog = async () => {
//     try {
//         changelogHtml.value = await marked.parse(changelogRaw);
//     } catch (e) {
//         changelogHtml.value = '<p>Ошибка загрузки журнала изменений</p>';
//     }
// };

interface DisplayMember extends CreditMember {
    username: string;
    avatarUrl: string;
}

const members = ref<DisplayMember[]>([]);

const loadTeamData = async () => {
    const loadedMembers: DisplayMember[] = [];

    for (const member of credits) {
        try {
            const { data } = await userAPI.getUserById(member.userId);

            loadedMembers.push({
                ...member,
                username: data.username,
                avatarUrl: data.avatarUrl
            });

        } catch (e) {
            console.error(`Не удалось загрузить данные для ID: ${member.userId}`);
            loadedMembers.push({
                ...member,
                username: "Анонимный хакер",
                avatarUrl: "https://via.placeholder.com/150"
            });
        }
    }
    members.value = loadedMembers;
};

onMounted( async () => {
    loadTeamData();
    const modules = import.meta.glob('./CHANGELOG.md', { as: 'raw', eager: true });
    changelogRaw.value = modules['./CHANGELOG.md'] || 'Загрузка изменений...';
});
</script>

<style scoped>
.about-page {
    display: grid;
    grid-template-columns: 1fr 400px;
    gap: 24px;
    padding: 30px;
    max-width: 1400px;
    margin: 0 auto;
    min-height: calc(100vh - 80px);
    color: var(--text-main);
}

.about-main {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.section-card {
    padding: 30px;
    background: var(--card-bg);
    border-radius: var(--radius-main);
    border: 1px solid var(--glass-border);
    box-shadow: var(--card-shadow);
    transition: var(--btn-transition);
}

.section-card:hover {
    box-shadow: var(--card-shadow-hover);
}

.section-title {
    display: flex;
    align-items: center;
    gap: 15px;
    font-size: 1.5rem;
    margin-bottom: 20px;
    color: var(--accent-blue);
}

.description-text {
    line-height: 1.6;
    font-size: 1.1rem;
    color: var(--text-main);
}

.tech-stack p {
    margin-bottom: 12px;
    line-height: 1.5;
}

.tech-link {
    font-weight: 600;
    text-decoration: none;
    border-bottom: 1px dashed transparent;
    transition: var(--btn-transition);
}

.tech-link.ts {
    color: var(--accent-blue);
}

.tech-link.ws {
    color: var(--accent-blue);
}

.tech-link:hover {
    border-bottom-color: currentColor;
    opacity: 0.8;
}

.tech-tag.vue {
    /*color: #42b883;*/
    color: var(--accent-blue);
    font-weight: 700;
}

.team-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 20px;
}

.member-card {
    display: flex;
    align-items: center;
    gap: 15px;
    padding: 15px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: var(--radius-sm);
    border: 1px solid var(--glass-border);
}

.member-avatar {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid var(--accent-blue);
}

.member-name {
    font-size: 1.1rem;
    margin: 0;
    width: 9rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.member-position {
    font-size: 0.85rem;
    color: var(--text-muted);
    margin: 4px 0 8px 0;
}

.member-socials {
    display: flex;
    gap: 12px;
}

.social-link {
    color: var(--text-main);
    font-size: 1.1rem;
    transition: 0.2s;
}

.social-link:hover {
    color: var(--accent-blue);
    transform: translateY(-2px);
}

.empty-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px;
    color: var(--text-muted);
    border: 2px dashed var(--glass-border);
    border-radius: var(--radius-sm);
    gap: 10px;
}

.empty-placeholder i {
    font-size: 2rem;
    opacity: 0.3;
}

.full-height {
    height: 70%;
    overflow-y: auto;
}

@media (max-width: 1000px) {
    .about-page {
        grid-template-columns: 1fr;
    }

    .about-sidebar {
        order: -1;
    }
}
</style>