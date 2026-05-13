import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/user';
import { logEvent } from '../utils/logger';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';

router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        const candidate = await User.findOne({ $or: [{ email }, { username }] });
        if (candidate) {
            return res.status(400).json({ message: 'Пользователь с таким именем или email уже существует' });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = new User({ username, email, password: hashedPassword });

        const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
        user.lastIp = Array.isArray(rawIp) ? rawIp[0] : rawIp;
        await user.save();

        logEvent('info', `Новый пользователь: ${username}`, { email })
        res.status(201).json({ message: 'Пользователь создан' });
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        await logEvent('error', `Критическая ошибка: ${message}`);
        res.status(500).json({ message: 'Что-то пошло не так...' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        if (user.isBanned) {
            return res.status(403).json({
                message: 'Ваш аккаунт заблокирован',
                reason: 'banned'
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            await logEvent('auth', `Неудачный вход: ${username}`, {
                ip: req.ip,
                reason: 'wrong_password'
            });
            return res.status(400).json({ message: 'Неверный пароль' });
        }

        const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
        const currentIp = Array.isArray(rawIp) ? rawIp[0] : rawIp;

        await User.updateOne({ _id: user._id }, { $set: { lastIp: currentIp } });

        await logEvent('auth', `IP ${currentIp} записан для юзера ${user.username}`);

        const token = jwt.sign(
            { userId: user._id },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        await logEvent('auth', `Успешный вход: ${username}`, { ip: currentIp });

        res.json({
            token,
            userId: user._id,
            username: user.username,
            email: user.email,
            avatarUrl: user.avatarUrl,
            role: user.role,
            lastIp: user.lastIp
        });

    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        await logEvent('error', `Критическая ошибка при входе: ${message}`);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

export default router;