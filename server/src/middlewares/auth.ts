import jwt from 'jsonwebtoken';
import { User } from '../models/user';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';

export const authMiddleware = async (req: any, res: any, next: any) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Нет авторизации' });
        }

        const decoded: any = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({ message: 'Пользователь не найден' });
        }

        if (user.isBanned) {
            return res.status(403).json({
                message: 'Аккаунт заблокирован',
                code: 'USER_BANNED'
            });
        }

        req.user = { id: user._id, role: user.role };
        next();
    } catch (e) {
        res.status(401).json({ message: 'Сессия истекла' });
    }
};