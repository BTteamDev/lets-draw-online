import mongoose from 'mongoose';

const BoardSchema = new mongoose.Schema({
    title: { type: String, required: true },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isPrivate: { type: Boolean, default: false },
    lines: { type: Array, default: [] },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    previewUrl: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
    canvasState: { type: Array, default: [] },
    userRoles: [
        {
            userId: { type: String },
            role: { type: String, enum: ['owner', 'editor', 'viewer'], default: 'editor' }
        }
    ]
});

export const Board = mongoose.model('Board', BoardSchema);