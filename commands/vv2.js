const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

async function vv2Command(sock, chatId, message) {
    const ownerJid = '254717246928@s.whatsapp.net';

    const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const quotedImage = quoted?.imageMessage;
    const quotedVideo = quoted?.videoMessage;

    if (quotedImage && quotedImage.viewOnce) {
        const stream = await downloadContentFromMessage(quotedImage, 'image');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        await sock.sendMessage(ownerJid, {
            image: buffer,
            caption: quotedImage.caption || ''
        });

    } else if (quotedVideo && quotedVideo.viewOnce) {
        const stream = await downloadContentFromMessage(quotedVideo, 'video');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        await sock.sendMessage(ownerJid, {
            video: buffer,
            caption: quotedVideo.caption || ''
        });

    } else {
        await sock.sendMessage(chatId, {
            text: '❌ Reply to a view-once image or video.'
        }, { quoted: message });
    }
}

module.exports = vv2Command;
