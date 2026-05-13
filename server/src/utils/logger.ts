import { Event } from '../models/event';

export const logEvent = async (type: string, message: string, metadata = {}) => {
	try {
		const newEvent = new Event({ type, message, metadata });
		await newEvent.save();
		console.log(`[SYSTEM ${type.toUpperCase()}]: ${message}`);
	} catch (e) {
		console.error('Ошибка логирования:', e);
	}
};