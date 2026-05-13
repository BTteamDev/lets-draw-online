import { Router } from 'express';
import { Drawing } from '../models/drawing';
import { logEvent } from '../utils/logger';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

router.post('/save', authMiddleware, async (req, res) => {
    try {
        const newDrawing = new Drawing(req.body);
        await newDrawing.save();
        res.status(201).json({ message: 'Рисунок сохранен', id: newDrawing._id });
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        await logEvent('error', `Критическая ошибка: ${message}`);
        res.status(500).json({ message: 'Ошибка при сохранении', e });
    }
});

export default router;