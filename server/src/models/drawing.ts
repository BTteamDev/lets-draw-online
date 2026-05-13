import { Schema, model } from 'mongoose';

const drawingSchema = new Schema({
    userId: { type: String, default: 'guest' },
    name: { type: String, default: 'My Sketch' },
    lines: [{
        points: [{ x: Number, y: Number }],
        color: String,
        width: Number
    }],
    createdAt: { type: Date, default: Date.now }
});

export const Drawing = model('Drawing', drawingSchema);