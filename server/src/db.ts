import mongoose from 'mongoose';

export const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/lets-draw');
        console.log('MongoDB подключён...');
    } catch (err) {
        console.error('Ошибка подключения к MongoDB:', err);
        process.exit(1);
    }
};