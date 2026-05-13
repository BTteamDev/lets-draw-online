import { Schema, model } from 'mongoose';

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    avatarUrl: {
        type: String,
        default: ''
    },
    role: {
        type: String,
        enum: ['superadmin', 'admin', 'dev', 'mod', 'editor', 'viewer'],
        default: 'viewer'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    note: { type: String, default: '' },
    isBanned: { type: Boolean, default: false },
    isMuted: { type: Boolean, default: false },
    isShadowed: { type: Boolean, default: false },
    isAvatarLocked: { type: Boolean, default: false },
    lastIp: { type: String, default: '' },
});

export const User = model('User', userSchema);