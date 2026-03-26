import axios from 'axios';

export const api = axios.create({ baseURL: 'https://drawing-server-mbnr.onrender.com/api' });

export const drawingAPI = {
    save(drawingData: any) {
        return api.post('/drawings/save', drawingData);
    }
};

export const authAPI = {
    register(userData: any) {
        return api.post('/auth/register', userData);
    },
    login(userData: any) {
        return api.post('/auth/login', userData);
    }
};

export const userAPI = {
    updateProfile: (data: { userId: string, username?: string, avatarUrl?: string }) => api.patch('/users/me', data),
    getMe: () => api.get('/users/me'),
    getUserById: (id: string) => api.get(`/users/${id}`)
};

export const boardAPI = {
    getPublic() {
        api.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.data?.code === 'USER_BANNED') {
                    localStorage.clear();
                    window.location.href = '/login?error=banned';
                }
                return Promise.reject(error);
            }
        );
        return api.get('/boards/public');
    },
    create(boardData: { title: string; isPrivate: boolean; userId: string }) {
        return api.post('/boards', boardData);
    },
    getMyBoards: (userId: string) => api.get(`/boards/my?userId=${userId}`),
    delete: (id: string) => api.delete(`/boards/${id}`),
    update: (id: string, data: { userId: string, title?: string, isPrivate?: boolean, previewUrl?: string }) => api.patch(`/boards/${id}`, data)
};