import { Router } from 'express'
import { Event } from '../models/event'
import { User } from '../models/user'
import { logEvent } from '../utils/logger'
import { Board } from '../models/board'

const router = Router()

const adminAuth = async (req: any, res: any, next: any) => {
    const userId = req.headers['x-user-id']

    if (!userId) {
        console.warn('[ADMIN AUTH]: Заголовок x-user-id отсутствует')
        return res.status(403).json({ message: 'ID пользователя не передан' })
    }

    const user = await User.findById(userId)

    if (user && ['superadmin', 'dev', 'admin'].includes(user.role)) {
        console.log(`[ADMIN AUTH]: Доступ разрешен для ${user.username} (${user.role})`)
        next()
    } else {
        console.warn(`[ADMIN AUTH]: Доступ запрещен. Юзер: ${user?.username}, Роль: ${user?.role}`)
        res.status(403).json({ message: 'Недостаточно прав' })
    }
}

router.get('/events', adminAuth, async (req, res) => {
    try {
        const events = await Event.find().sort({ timestamp: -1 }).limit(100)
        res.json(events)
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e)
        await logEvent('error', `Критическая ошибка: ${message}`)
        res.status(500).json({ message: 'Ошибка сервера' })
    }
})

router.get('/users', adminAuth, async (req, res) => {
    try {
        const { search } = req.query
        let query = {}

        if (search && typeof search === 'string') {
            if (search.startsWith('@name=')) {
                query = { username: new RegExp(search.replace('@name=', ''), 'i') }
            } else if (search.startsWith('@email=')) {
                query = { email: new RegExp(search.replace('@email=', ''), 'i') }
            } else if (search.startsWith('@id=')) {
                query = { _id: search.replace('@id=', '').trim() }
            } else {
                query = {
                    $or: [{ username: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }],
                }
            }
        }

        const users = await User.find(query)
            .select('username email avatarUrl role lastIp isBanned isMuted')
            .sort({ createdAt: -1 });
        res.json(users)
    } catch (e) {
        res.status(500).json({ message: 'Ошибка при получении списка пользователей' })
    }
})

router.get('/users/:id/details', adminAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password')
        if (!user) return res.status(404).json({ message: 'Юзер не найден' })

        const boards = await Board.find({ owner: user._id })

        res.json({ user, boards })
    } catch (e) {
        res.status(500).json({ message: 'Ошибка получения деталей' })
    }
})

router.delete('/users/:id/avatar', adminAuth, async (req, res) => {
    await User.findByIdAndUpdate(req.params.id, { avatarUrl: null })
    const user = await User.findById(req.params.id)
    await logEvent('warn', `Администратор удалил пользователя ${user?.username} (UID: ${user?._id})`)
    res.json({ message: 'Аватар удален' })
})

router.patch('/users/:id/avatar-lock', adminAuth, async (req, res) => {
    const user = await User.findById(req.params.id)
    if (user) {
        user.isAvatarLocked = !user.isAvatarLocked
        await user.save()
        await logEvent(
            'warn',
            `Администратор запретил пользователю ${user.username} изменять аватар (UID: ${user?._id})`,
        )
        res.json({ isAvatarLocked: user.isAvatarLocked })
    }
})

router.patch('/users/:id/note', adminAuth, async (req, res) => {
    try {
        const { note } = req.body
        const targetId = req.params.id
        const adminId = req.headers['x-user-id'];

        if (!targetId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: 'Невалидный ID пользователя' });
        }

        const user = await User.findByIdAndUpdate(
            targetId,
            { note: note || '' },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' })
        }


        try {
            await logEvent('info', `Обновлена заметка для пользователя: ${user.username} (UID: ${user?._id})`, {
                adminId: adminId,
                targetId: targetId,
                notePreview: note ? (note.substring(0, 50) + (note.length > 50 ? '...' : '')) : 'пусто'
            });
        } catch (logErr) {
            console.error('[LOGGER ERROR]:', logErr);
        }

        res.json({ message: 'Заметка успешно сохранена', note: user.note });
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e)
        logEvent('error', `Произошла ошибка при сохранении заметки о пользователе: ${message}`)
        console.error('[SERVER ERROR]:', e);
        res.status(500).json({ message: 'Ошибка при сохранении заметки' })
    }
})

router.patch('/users/:id/ban', adminAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id)

        if (!user) return res.status(404).json({ message: 'Пользователь не найден' })

        if (user.role === 'superadmin') {
            return res.status(403).json({ message: 'Нельзя забанить суперадмина' })
        }

        user.isBanned = !user.isBanned
        await user.save()

        const io = req.app.get('socketio')
        if (io && user.isBanned) {
            console.log(`[BAN]: Отправка сигнала принудительного выхода для ${user.username}`)
            io.to(user._id.toString()).emit('user_banned_force_logout', {
                message: 'Вы больше не залогинены, перезайдите в аккаунт'
            })
        }

        await logEvent('warning', `Статус бана изменен для пользователя ${user.username} (UID: ${user?._id})`, {
            targetId: user._id,
            isBanned: user.isBanned,
        })

        res.json({ isBanned: user.isBanned })
    } catch (e) {
        res.status(500).json({ message: 'Ошибка при изменении статуса бана' })
    }
})

router.patch('/users/:id/mute', adminAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
        if (!user) return res.status(404).json({ message: 'Пользователь не найден' })

        user.isMuted = !user.isMuted
        await user.save()

        const io = req.app.get('socketio')
        if (io) {
            io.to(user._id.toString()).emit('mute_status_changed', { isMuted: user.isMuted })
        }

        await logEvent('warning', `${user.isMuted ? 'МУТ' : 'РАЗМУТ'}: ${user.username} (UID: ${user?._id})`, {
            adminId: req.headers['x-user-id'],
            targetId: user._id,
        })

        res.json({ isMuted: user.isMuted })
    } catch (e) {
        res.status(500).json({ message: 'Ошибка при переключении мута' })
    }
})

router.patch('/users/:id/role', adminAuth, async (req, res) => {
    try {
        const { role } = req.body
        const targetUserId = req.params.id
        const adminId = req.headers['x-user-id']

        const adminUser = await User.findById(adminId)
        if (!adminUser) return res.status(403).json({ message: 'Админ не найден' })

        if (adminUser.role === 'admin') {
            if (role === 'admin' || role === 'superadmin') {
                return res.status(403).json({ message: 'Недостаточно прав для назначения этой роли' })
            }
        }

        const updatedUser = await User.findByIdAndUpdate(targetUserId, { role: role }, { new: true })

        if (!updatedUser) return res.status(404).json({ message: 'Пользователь не найден' })

        await logEvent('info', `Роль пользователя ${updatedUser.username} изменена на ${role} (UID: ${updatedUser?._id})`, {
            adminId,
        })

        res.json({ role: updatedUser.role })
    } catch (e) {
        res.status(500).json({ message: 'Ошибка сервера при смене роли' })
    }
})

router.delete('/users/:id', adminAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
        if (user?.role === 'superadmin') {
            return res.status(403).json({ message: 'Нельзя удалить суперадмина' })
        }
        await User.findByIdAndDelete(req.params.id)
        await logEvent('warning', `Пользователь удален админом`, { targetId: req.params.id })
        res.json({ message: 'Пользователь удален' })
    } catch (e) {
        res.status(500).json({ message: 'Ошибка при удалении' })
    }
})

export default router
