import { createRouter, createWebHistory } from 'vue-router'
import RoomView from '@/views/Room/RoomView.vue';

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        //  {
        //    path: '/',
        //    name: 'home',
        //    component: () => import('@/views/Home/HomeView.vue')
        //  },
        {
            path: '/admin',
            name: 'admin',
            component: () => import('@/views/Admin/AdminView.vue')
        },
        {
            path: '/admin/events',
            name: 'admin events',
            component: () => import('@/views/Admin/AdminEventsView.vue')
        },
        {
            path: '/admin/users/',
            name: 'admin users',
            component: () => import('@/views/Admin/AdminUsersView.vue')
        },
        {
            path: '/admin/users/:id',
            name: 'admin user details',
            component: () => import('@/views/Admin/AdminUserDetailsView.vue')
        },
        {
            path: '/tools',
            name: 'tools',
            component: () => import('@/views/Tools/ToolsView.vue')
        },
        {
            path: '/tools/canvas',
            name: 'tools canvas',
            component: () => import('@/views/Tools/ToolsCanvasView.vue')
        },
        {
            path: '/tools/boards',
            name: 'tools boards',
            component: () => import('@/views/Tools/ToolsBoardsView.vue')
        },
        {
            path: '/',
            name: 'boards',
            component: () => import('@/views/Boards/BoardsView.vue')
        },
        {
            path: '/about',
            name: 'about',
            component: () => import('@/views/About/AboutView.vue')
        },
        {
            path: '/board/:id',
            name: 'room',
            component: RoomView,
            props: true
        },
        {
            path: '/profile',
            name: 'profile',
            component: () => import('@/views/Profile/ProfileView.vue'),
        },
    ]
})

export default router
