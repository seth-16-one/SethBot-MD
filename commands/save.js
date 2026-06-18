const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

async function saveCommand(sock, chatId, message) {
    try {
        const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;

        if (!quoted) {
            return await sock.sendMessage(chatId, {
                text: '❌ Reply to a status image or video.'
            }, { quoted: message });
        }

        const ownerJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';

        if (quoted.imageMessage) {
            const stream = await downloadContentFromMessage(
                quoted.imageMessage,
                'image'
            );

            let buffer = Buffer.from([]);

            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            await sock.sendMessage(ownerJid, {
                image: buffer,
                caption: quoted.imageMessage.caption || '📸 Saved Status'
            });

        } else if (quoted.videoMessage) {

            const stream = await downloadContentFromMessage(
                quoted.videoMessage,
                'video'
            );

            let buffer = Buffer.from([]);

            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            await sock.sendMessage(ownerJid, {
                video: buffer,
                caption: quoted.videoMessage.caption || '🎥 Saved Status'
            });

        } else {

            await sock.sendMessage(chatId, {
                text: '❌ Only image and video statuses are supported.'
            }, { quoted: message });

            return;
        }

        await sock.sendMessage(chatId, {
            text: '✅ Status saved to your inbox.'
        }, { quoted: message });

    } catch (error) {
        console.error('Save Status Error:', error);

        await sock.sendMessage(chatId, {
            text: '❌ Failed to save status.'
        }, { quoted: message });
    }
}

module.exports = saveCommand;
