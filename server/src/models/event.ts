import { Schema, model, Document } from 'mongoose';

export interface IEvent extends Document {
    type: 'error' | 'warning' | 'info' | 'auth' | 'report';
    message: string;
    metadata: any;
    timestamp: Date;
}

const eventSchema = new Schema({
    type: {
        type: String,
        enum: ['error', 'warning', 'info', 'auth', 'report'],
        required: true
    },
    message: { type: String, required: true },
    metadata: { type: Object, default: {} },
    timestamp: { type: Date, default: Date.now }
});

export const Event = model<IEvent>('Event', eventSchema);