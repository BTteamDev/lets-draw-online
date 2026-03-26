export const getTooltipText = (role: string) => {
    const texts: Record<string, string> = {
        'superadmin': 'Владелец платформы',
        'admin': 'Администратор платформы',
        'dev': 'Разработчик платформы',
        'mod': 'Модератор платформы'
    };
    return texts[role] || 'Участник сообщества';
};