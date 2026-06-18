const fs = require('fs');
const os = require('os');
const path = require('path');
const Tesseract = require('tesseract.js');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

async function ocrCommand(sock, chatId, message) {
    try {
        const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;

        let imageMessage = null;

        if (quoted?.imageMessage) {
            imageMessage = quoted.imageMessage;
        } else if (message.message?.imageMessage) {
            imageMessage = message.message.imageMessage;
        }

        if (!imageMessage) {
            return await sock.sendMessage(chatId, {
                text: '📸 Reply to an image with *.ocr*'
            }, { quoted: message });
        }

        await sock.sendMessage(chatId, {
            text: '🔍 Reading text from image...'
        }, { quoted: message });

        const stream = await downloadContentFromMessage(imageMessage, 'image');

        const chunks = [];
        for await (const chunk of stream) {
            chunks.push(chunk);
        }

        const buffer = Buffer.concat(chunks);

        const tempFile = path.join(
            os.tmpdir(),
            `ocr_${Date.now()}.jpg`
        );

        fs.writeFileSync(tempFile, buffer);

        const result = await Tesseract.recognize(
            tempFile,
            'eng'
        );

        fs.unlinkSync(tempFile);

        const text = result.data.text.trim();

        if (!text) {
            return await sock.sendMessage(chatId, {
                text: '❌ No text found in image.'
            }, { quoted: message });
        }

        await sock.sendMessage(chatId, {
            text: `📄 *Extracted Text*\n\n${text}`
        }, { quoted: message });

    } catch (err) {
        console.error('OCR Error:', err);

        await sock.sendMessage(chatId, {
            text: '❌ OCR failed.'
        }, { quoted: message });
    }
}

module.exports = ocrCommand;
