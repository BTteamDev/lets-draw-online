import mongoose from 'mongoose';

const MONGO_URI = 'mongodb+srv://bogdantorr_db_user:dAzIrw3Geb4n5qjH@lets-draw.81blfzr.mongodb.net/?appName=lets-draw';

const args = process.argv.slice(2);
const [action, userId, role] = args;

const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({
	username: String,
	role: String
}));

async function run() {
	if (action !== '--addrole' || !userId || !role) {
		console.log('Использование: npx ts-node manage-user.ts --addrole <ID> <role>');
		process.exit(1);
	}

	try {
		await mongoose.connect(MONGO_URI);

		const user = await User.findById(userId);

		if (!user) {
			console.error('Пользователь не найден, проверьте ID');
			process.exit(1);
		}

		user.role = role;
		await user.save();

		console.log(`Готово! Пользоваель ${user.username} теперь ${role}`);
	} catch (err) {
		console.error('Ошибка:', err);
	} finally {
		await mongoose.disconnect();
		process.exit(0);
	}
}

run();