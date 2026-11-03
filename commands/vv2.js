const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { getPrimaryOwnerNumber } = require('../lib/owner');

async function vv2Command(sock, chatId, message) {
    // Resolve this customer's owner number per-invocation so each customer bot
    // sends view-once media to its own owner (OWNER_NUMBER env / DATA_DIR/owner.json
    // -> settings.ownerNumber), never a shared hardcoded number.
    const ownerNumber = getPrimaryOwnerNumber();
    const ownerJid = `${ownerNumber}@s.whatsapp.net`;

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
