import { reactive } from 'vue';

export const authState = reactive({
    isLoggedIn: !!localStorage.getItem('token'),
    user: JSON.parse(localStorage.getItem('user') || 'null')
});

export const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    authState.isLoggedIn = false;
    authState.user = null;
};

export const updateUsernameInStore = (newName: string) => {
    if (authState.user) {
        authState.user.username = newName;
        localStorage.setItem('user', JSON.stringify(authState.user));
    }
};