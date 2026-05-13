import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import { connectDB } from './db';
import drawingRoutes from './routes/drawingRoutes';
import authRoutes from './routes/authRoutes';
import boardsRoutes from './routes/boardRoutes';
import userRoutes from './routes/userRoutes';
import http from 'http';
import { Server } from 'socket.io';
import { UserRole } from './interfaces';
import { Board } from './models/board';
import adminRoutes from './routes/adminRoutes';
import { logEvent } from './utils/logger';
import { User } from './models/user';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

app.set('socketio', io);
app.set('trust proxy', true);

const PORT = process.env.PORT || 5000;
const roomUsers = new Map<string, any[]>();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

connectDB();

app.get('/', (req, res) => {
    res.send('Сервер "Let\'s Draw" запущен');
});

app.use('/api/drawings', drawingRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/boards', boardsRoutes(roomUsers));
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

const saySystem = (roomId: string, text: string) => {
    const systemMsg = {
        id: 'sys-' + Date.now(),
        userId: 'system',
        username: 'система',
        text: text,
        timestamp: new Date().toISOString(),
        role: 'system'
    };
    io.to(roomId).emit('new-message', systemMsg);
};

const socketToUser = new Map<string, { roomId: string, userId: string }>();

io.on('connection', (socket) => {
    console.log('Подключился новый пользователь:', socket.id);

    socket.on('register-self', (userId: string) => {
        socket.join(userId);
        console.log(`[Socket] Юзер ${userId} подключил личный канал уведомлений`);
    });

    socket.on('join-room', async ({ roomId, user }) => {
        try {
            socket.join(roomId);
            socketToUser.set(socket.id, { roomId, userId: user.id });

            const [boardDoc, dbUser] = await Promise.all([
                Board.findById(roomId),
                User.findById(user.id)
            ]);

            if (!boardDoc) return;

            const systemRole = dbUser ? dbUser.role : 'viewer';

            let roomRole: string = 'viewer';
            if (boardDoc.creator.toString() === user.id) {
                roomRole = 'owner';
            } else {
                const savedRoleEntry = boardDoc.userRoles.find(r => r.userId === user.id);
                roomRole = savedRoleEntry ? savedRoleEntry.role : 'viewer';
            }

            const fullUser = {
                ...user,
                email: dbUser?.email,
                systemRole: systemRole,
                roomRole: roomRole,
                isOnline: true,
                note: dbUser?.note || '',
                isBanned: dbUser?.isBanned,
                isMuted: dbUser?.isMuted,
                isShadowed: dbUser?.isShadowed
            };

            if (fullUser.isBanned) {
                return;
            }

            if (!roomUsers.has(roomId)) {
                roomUsers.set(roomId, []);
            }
            const users = roomUsers.get(roomId)!;

            const existingUserIndex = users.findIndex(u => u.id === user.id);
            if (existingUserIndex > -1) {
                users[existingUserIndex] = fullUser;
            } else {
                users.push(fullUser);
            }

            io.to(roomId).emit('update-user-list', users);

            socket.emit('load-board-data', {
                title: boardDoc.title,
                canvasState: boardDoc.canvasState || []
            });

            const roleNames = { 'editor': 'Редактор', 'viewer': 'Зритель', 'owner': 'Владелец' };
            console.log(`[SOCKET]: Пользователь ${user.username} вошел в комнату ${roomId}. Системная роль: ${systemRole}, Роль в комнате: ${roomRole}`);
            saySystem(roomId, `Пользователь ${user.username} назначен ${roleNames[roomRole as keyof typeof roleNames]}`);

        } catch (error) {
            console.error('[SOCKET ERROR]: join-room failed:', error);
        }
    });

    socket.on('change-user-role', async ({ roomId, targetUserId, newRole }) => {
        const initiator = socketToUser.get(socket.id);
        const room = roomUsers.get(roomId);

        if (room && initiator) {
            const initiatorUser = room.find(u => u.id === initiator.userId);

            if (initiatorUser?.roomRole === 'owner') {
                const targetUser = room.find(u => u.id === targetUserId);
                if (targetUser) {
                    targetUser.roomRole = newRole;
                    io.to(roomId).emit('update-user-list', room);
                    const roleNames = { 'editor': 'Редактором', 'viewer': 'Зрителем', 'owner': 'Владельцем' };
                    saySystem(roomId, `Пользователь ${targetUser.username} назначен ${roleNames[newRole as keyof typeof roleNames]}`);
                }
            }

            await Board.updateOne(
                { _id: roomId, "userRoles.userId": targetUserId },
                { $set: { "userRoles.$.role": newRole } }
            );
        }
    });

    socket.on('kick-user', ({ roomId, targetUserId }) => {
        const initiator = socketToUser.get(socket.id);

        if (initiator) {
            const room = roomUsers.get(roomId);
            const initiatorUser = room?.find(u => u.id === initiator.userId);

            if (initiatorUser?.roomRole === 'owner') {
                const targetSocketEntry = Array.from(socketToUser.entries())
                    .find(([sId, data]) => data.userId === targetUserId && data.roomId === roomId);

                if (targetSocketEntry) {
                    const [targetSocketId] = targetSocketEntry;
                    const targetSocket = io.sockets.sockets.get(targetSocketId);

                    const targetUser = room?.find(u => u.id === targetUserId);
                    if (targetUser) {
                        saySystem(roomId, `Пользователь ${targetUser.username} был выгнан из комнаты`);
                    }

                    if (targetSocket) {
                        targetSocket.emit('kicked');
                        targetSocket.leave(roomId);
                        targetSocket.disconnect();
                    }
                }
            }
        }
    });

    socket.on('draw-line', async ({ roomId, line }) => {
        const connection = socketToUser.get(socket.id);
        const user = roomUsers.get(roomId)?.find(u => u.id === connection?.userId);

        if (user.isBanned) {
            return;
        }

        if (user && (user.roomRole === 'owner' || user.roomRole === 'editor')) {
            socket.to(roomId).emit('draw-line', line);
            await Board.findByIdAndUpdate(roomId, {
                $push: { canvasState: line }
            });
        } else {
            console.log(`Попытка рисования без прав от ${user?.username}`);
        }
    });

    socket.on('undo-line', async ({ roomId }) => {
        try {
            const board = await Board.findById(roomId);
            if (board && board.lines.length > 0) {
                board.lines.pop();
                await board.save();

                socket.to(roomId).emit('undo-line-confirmed');
            }
        } catch (e) {
            const message = e instanceof Error ? e.message : String(e);
            await logEvent('error', `Критическая ошибка: ${message}`);
            console.error('Ошибка при Undo на сервере:', e);
        }
    });

    socket.on('disconnect', async () => {
        const connectionInfo = socketToUser.get(socket.id);

        if (connectionInfo) {
            const { roomId, userId } = connectionInfo;
            let users = roomUsers.get(roomId) || [];

            const connection = socketToUser.get(socket.id);
            const user = roomUsers.get(roomId)?.find(u => u.id === connection?.userId);

            const boardDoc = await Board.findById(roomId);
            const roomName = boardDoc?.title;

            users = users.filter(u => u.id !== userId);
            roomUsers.set(roomId, users);
            socketToUser.delete(socket.id);
            io.to(roomId).emit('update-user-list', users);

            if (user) {
                console.log(`Пользователь ${user.username} (UID: ${userId}) покинул комнату «${roomName}» (RoomID: ${roomId})`);
                saySystem(roomId, `Пользователь ${user.username} покинул комнату`);
            } else {
                console.log(`Неизвестный сокет ${socket.id} (UID: ${userId}) отключился от «${roomName}»`);
            }
        }
    });

    socket.on('send-message', async ({ roomId, message }) => {
        const user = await User.findById(message.userId.id);

        if (!user || user.isBanned || user.isMuted) {
            console.log(`[Чат] Отклонено сообщение от замученного пользователя: ${message.username}`);
            return;
        }

        const boardDoc = await Board.findById(roomId);
        const roomName = boardDoc?.title;

        socket.to(roomId).emit('new-message', message);
        console.log(`[Чат] Сообщение от ${message.username} в комнате «${roomName}» (RoomID: ${roomId})`);
    });
});

setInterval(() => {
    const counts: Record<string, number> = {};
    roomUsers.forEach((users, roomId) => {
        counts[roomId] = users.length;
    });
    io.emit('global-users-update', counts);
}, 3000);

server.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
}); 