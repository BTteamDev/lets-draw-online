import { Router } from 'express';
import { User } from '../models/user';
import { logEvent } from '../utils/logger';

const router = Router();

router.get('/me', async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) return res.status(400).json({ message: 'ID обязателен' });
        
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'Пользователь не найден' });
        
        res.json(user);
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        await logEvent('error', `Критическая ошибка: ${message}`);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

router.get('/:id', async (req, res) => {
    const user = await User.findById(req.params.id).select('username avatarUrl');
    res.json(user);
});

router.patch('/me', async (req, res) => {
    try {
        const { userId, username, email, avatarUrl } = req.body;

        if (!userId) {
            return res.status(400).json({ message: 'ID пользователя обязателен' });
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId, 
            { username, email, avatarUrl }, 
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        res.json(updatedUser);
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        await logEvent('error', `Критическая ошибка: ${message}`);
        res.status(500).json({ message: 'Ошибка обновления профиля' });
    }
});

export default router;