const isAdmin = require('../lib/isAdmin');

async function muteCommand(sock, chatId, senderId, message, durationInMinutes) {
    

    const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);
    if (!isBotAdmin) {
        await sock.sendMessage(chatId, { text: 'Please make the bot an admin first.' }, { quoted: message });
        return;
    }

    if (!isSenderAdmin) {
        await sock.sendMessage(chatId, { text: 'Only group admins can use the mute command.' }, { quoted: message });
        return;
    }

    const hasDuration = typeof durationInMinutes === 'number' && !isNaN(durationInMinutes) && durationInMinutes > 0;
    const durationInMilliseconds = hasDuration ? durationInMinutes * 60 * 1000 : 0;
    try {
        await sock.groupSettingUpdate(chatId, 'announcement');
        if (hasDuration) {
            await sock.sendMessage(chatId, { text: `The group has been muted for ${durationInMinutes} minutes.` }, { quoted: message });
            setTimeout(async () => {
                await sock.groupSettingUpdate(chatId, 'not_announcement');
                await sock.sendMessage(chatId, { text: 'The group has been unmuted.' }, { quoted: message });
            }, durationInMilliseconds);
        } else {
            await sock.sendMessage(chatId, { text: 'The group has been muted.' }, { quoted: message });
        }
    } catch (error) {
        console.error('Error muting/unmuting the group:', error);
        await sock.sendMessage(chatId, { text: 'An error occurred while muting/unmuting the group. Please try again.' }, { quoted: message });
    }
}

module.exports = muteCommand;
