<template>
	<div class="auth-template-wrapper">
		<div class="auth-card">
			<div v-if="isBannedError" class="banned-overlay">
				<div class="banned-content">
					<i class="fa-solid fa-user-slash"></i>
					<h2>ДОСТУП ОГРАНИЧЕН</h2>
					<p>Ваш аккаунт заблокирован администрацией за нарушение правил сообщества.</p>
					<button @click="isBannedError = false" class="auth-btn">Понятно</button>
				</div>
			</div>

			<div v-else>
				<h2>{{ isLogin ? 'С возвращением!' : 'Создать аккаунт' }}</h2>
				<p class="subtitle">{{ isLogin ? 'Войдите в свою облачную студию' : 'Присоединяйтесь к сообществу художников' }}</p>

				<form @submit.prevent="handleSubmit">
					<div class="input-group">
						<label>Никнейм</label>
						<input v-model="form.username" type="text" placeholder="CloudMaster" required />
					</div>

					<div v-if="!isLogin" class="input-group">
						<label>Email</label>
						<input v-model="form.email" type="email" placeholder="sky@draw.com" required />
					</div>

					<div class="input-group">
						<label>Пароль</label>
						<input v-model="form.password" type="password" placeholder="••••••••" required />
					</div>

					<button type="submit" class="auth-btn">
						{{ isLogin ? 'Войти' : 'Зарегистрироваться' }}
					</button>
				</form>

				<div class="switch-mode">
					{{ isLogin ? 'Нет аккаунта?' : 'Уже есть аккаунт?' }}
					<span @click="isLogin = !isLogin">{{ isLogin ? 'Создать' : 'Войти' }}</span>
				</div>
			</div>
		</div>
		<NotificationList />
	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { authAPI } from '@/ts/utils/api';
import { authState } from '@/ts/store/auth';
import NotificationList from '../notification/NotificationList.vue';
import { useNotifications } from '@/ts/utils/notifications';
import { ErrorRegistry, InfoRegistry } from '@/ts/utils/messages';

const { addNotify } = useNotifications();

const isLogin = ref(true);
const form = ref({
	username: '',
	password: '',
	email: ''
});
const isBannedError = ref(false);

const handleSubmit = async () => {
	try {
		if (isLogin.value) {
			const res = await authAPI.login(form.value);
			localStorage.setItem('token', res.data.token);

			const userData = {
				id: res.data.userId,
				username: res.data.username,
				email: res.data.email,
				avatarUrl: res.data.avatarUrl,
				role: res.data.role,
				isBanned: res.data.isBanned,
				isMuted: res.data.isMuted
			};
			localStorage.setItem('user', JSON.stringify(userData));

			authState.isLoggedIn = true;
			authState.user = userData;
		} else {
			await authAPI.register(form.value);
			addNotify('info', InfoRegistry.AUTH_SUCCESS, 0);
			isLogin.value = true;
		}
	} catch (e: any) {
		if (e.response?.data?.reason === 'banned') {
			isBannedError.value = true;
			addNotify('error', 'Вход невозможен: аккаунт заблокирован', 0);
		} else {
			addNotify('error', 'Ошибка входа: возможно, Ваш аккаунт удалён или введены неверные имя или пароль', 0);
		}
	}
};
</script>

<style scoped>
.auth-card {
	max-width: 420px;
	margin: 80px auto;
	padding: 40px;
	background: var(--card-bg);
	border-radius: var(--radius-main);
	box-shadow: var(--card-shadow);
	text-align: center;
	border: 1px solid var(--glass-border);
	transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.auth-card:hover {
	transform: translateY(-5px);
	box-shadow: var(--card-shadow-hover);
}

h2 {
	color: var(--text-main);
	font-size: 1.8rem;
	margin-bottom: 8px;
	font-weight: 700;
}

.subtitle {
	color: var(--text-muted);
	margin-bottom: 35px;
	font-size: 0.95rem;
	line-height: 1.4;
}

.input-group {
	text-align: left;
	margin-bottom: 22px;
}

.input-group label {
	display: block;
	margin-bottom: 8px;
	font-weight: 600;
	font-size: 0.85rem;
	color: var(--text-main);
	text-transform: uppercase;
	letter-spacing: 0.5px;
}

.input-group input {
	width: 100%;
	padding: 14px 16px;
	background-color: var(--input-bg);
	border: 2px solid transparent;
	border-radius: var(--radius-sm);
	font-size: 1rem;
	color: var(--text-main);
	transition: var(--btn-transition);
}

.input-group input::placeholder {
	color: #a0a0a0;
}

.input-group input:focus {
	border-color: var(--accent-blue);
	background-color: var(--card-bg);
	outline: none;
	box-shadow: 0 0 0 4px rgba(52, 152, 219, 0.1);
}

.auth-btn {
	width: 100%;
	padding: 16px;
	margin-top: 10px;
	background: var(--accent-blue);
	color: white;
	border: none;
	border-radius: var(--radius-sm);
	font-size: 1rem;
	font-weight: 700;
	cursor: pointer;
	transition: var(--btn-transition);
	box-shadow: 0 4px 6px rgba(52, 152, 219, 0.2);
}

.auth-btn:hover {
	background: #2980b9;
	transform: translateY(-1px);
	box-shadow: 0 6px 12px rgba(52, 152, 219, 0.3);
}

.auth-btn:active {
	transform: translateY(0);
}

.switch-mode {
	margin-top: 25px;
	padding-top: 20px;
	border-top: 1px solid var(--input-bg);
	color: var(--text-muted);
	font-size: 0.9rem;
}

.switch-mode span {
	color: var(--accent-blue);
	cursor: pointer;
	font-weight: 700;
	margin-left: 5px;
	transition: color 0.2s;
}

.switch-mode span:hover {
	color: var(--accent-purple);
	text-decoration: underline;
}

.banned-overlay {
	padding: 20px;
	animation: shake 0.5s ease-in-out;
}

.banned-content i {
	font-size: 4rem;
	color: var(--color-danger);
	margin-bottom: 20px;
}

.banned-content h2 {
	color: var(--color-danger);
	letter-spacing: 2px;
}

.banned-content p {
	color: var(--text-main);
	background: rgba(231, 76, 60, 0.1);
	padding: 15px;
	border-radius: var(--radius-sm);
	border: 1px solid var(--color-danger);
}

@keyframes shake {

	0%,
	100% {
		transform: translateX(0);
	}

	25% {
		transform: translateX(-10px);
	}

	75% {
		transform: translateX(10px);
	}
}

@media (max-width: 480px) {
	.auth-card {
		margin: 20px;
		padding: 30px 20px;
	}
}
</style>