import { Router } from 'express';
import { Board } from '../models/board';
import type { UserProfile } from '../interfaces';
import { logEvent } from '../utils/logger';

export default function(roomUsers: Map<string, UserProfile[]>) {
    const router = Router();

      router.post('/', async (req, res) => {
      console.log('запрос:', req.body);
      try {
        const { title, isPrivate, userId } = req.body;
        const newBoard = new Board({
          title,
          isPrivate,
          creator: userId,
          lines: []
        });
        await newBoard.save();
        res.status(201).json(newBoard);
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        await logEvent('error', `Критическая ошибка: ${message}`);
        res.status(500).json({ message: 'Ошибка при создании доски' });
      }
    });

    router.get('/my', async (req, res) => {
        try {
            const { userId } = req.query;
            
            if (!userId) {
                return res.status(400).json({ message: 'userId не указан' });
            }

            const boards = await Board.find({ creator: userId })
                .sort({ createdAt: -1 });
                
            res.json(boards);
        } catch (e) {
          const message = e instanceof Error ? e.message : String(e);
          await logEvent('error', `Критическая ошибка: ${message}`);
            res.status(500).json({ message: 'Ошибка сервера' });
        }
    });

    router.get('/public', async (req, res) => {
        try {
            const boards = await Board.find({ isPrivate: false })
                .populate('creator', 'username avatarUrl role')
                .sort({ createdAt: -1 });

            const boardsWithCount = boards.map(board => {
                const activeUsers = roomUsers.get(board._id.toString())?.length || 0;
                
                return { 
                    ...board.toObject(), 
                    usersCount: activeUsers 
                };
            });

            res.json(boardsWithCount);
        } catch (e) {
            const message = e instanceof Error ? e.message : String(e);
            await logEvent('error', `Критическая ошибка: ${message}`);
            res.status(500).json({ message: 'Ошибка при получении досок' });
        }
    });

    router.post('/:id/toggle-like', async (req, res) => {
      try {
          const { userId } = req.body;
          const board = await Board.findById(req.params.id);
          if (!board) return res.status(404).send('Доска не найдена');

          const index = board.likes.indexOf(userId);
          if (index === -1) {
              board.likes.push(userId);
          } else {
              board.likes.splice(index, 1);
          }

          await board.save();
          res.json({ likesCount: board.likes.length, isLiked: index === -1 });
      } catch (e) {
          const message = e instanceof Error ? e.message : String(e);
          await logEvent('error', `Критическая ошибка: ${message}`);
          res.status(500).send('Ошибка сервера');
      }
    });

    router.patch('/:id', async (req, res) => {
        try {
            const { title, isPrivate, userId, previewUrl } = req.body;
            const board = await Board.findByIdAndUpdate(
              req.params.id,
              { title, isPrivate, previewUrl },
              { new: true }
            );

            if (!board) return res.status(404).json({ message: 'Доска не найдена' });
            
            if (board.creator.toString() !== userId) {
                return res.status(403).json({ message: 'Нет прав на редактирование' });
            }

            if (title) board.title = title;
            if (typeof isPrivate === 'boolean') board.isPrivate = isPrivate;

            await board.save();
            res.json(board);
        } catch (e) {
              const message = e instanceof Error ? e.message : String(e);
              await logEvent('error', `Критическая ошибка: ${message}`);
            res.status(500).json({ message: 'Ошибка при обновлении доски' });
        }
    });

    router.delete('/:id', async (req, res) => {
      try {
        const { userId } = req.body;
        const board = await Board.findById(req.params.id);

        if (!board) {
          return res.status(404).json({ message: 'Доска не найдена' });
        }

         if (board.creator.toString() !== userId) {
             return res.status(403).json({ message: 'У вас нет прав на удаление этой доски' });
         }

         await Board.findByIdAndDelete(req.params.id);
         
        roomUsers.delete(req.params.id);

        res.json({ message: 'Доска успешно удалена' });
       } catch (e) {
          const message = e instanceof Error ? e.message : String(e);
          await logEvent('error', `Критическая ошибка: ${message}`);
          res.status(500).json({ message: 'Ошибка сервера при удалении' });
       }
    });

    return router;
}