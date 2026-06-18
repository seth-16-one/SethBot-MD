const pdf = require('pdf-parse');
const fs = require('fs');
const path = require('path');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

async function ocrpdfCommand(sock, chatId, message) {
    try {
        const quoted =
            message.message?.extendedTextMessage?.contextInfo?.quotedMessage;

        if (!quoted?.documentMessage) {
            return await sock.sendMessage(chatId, {
                text: '📄 Reply to a PDF document with .ocrpdf'
            }, { quoted: message });
        }

        if (quoted.documentMessage.mimetype !== 'application/pdf') {
            return await sock.sendMessage(chatId, {
                text: '❌ The replied file is not a PDF.'
            }, { quoted: message });
        }

        await sock.sendMessage(chatId, {
            text: '📄 Extracting text from PDF...'
        }, { quoted: message });

        const stream = await downloadContentFromMessage(
            quoted.documentMessage,
            'document'
        );

        let buffer = Buffer.from([]);

        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        const data = await pdf(buffer);
        const extractedText = data.text?.trim();

        if (!extractedText) {
            return await sock.sendMessage(chatId, {
                text: '❌ No text found in PDF.'
            }, { quoted: message });
        }

        const words = extractedText.split(/\s+/).filter(Boolean).length;
        const chars = extractedText.length;
        const pages = data.numpages || 0;

        if (extractedText.length < 3500) {
            return await sock.sendMessage(chatId, {
                text:
`📄 PDF Analysis

📑 Pages: ${pages}
📝 Words: ${words}
🔤 Characters: ${chars}

━━━━━━━━━━━━━━

${extractedText}`
            }, { quoted: message });
        }

        const preview = extractedText.slice(0, 3000);

        await sock.sendMessage(chatId, {
            text:
`📄 PDF Analysis

📑 Pages: ${pages}
📝 Words: ${words}
🔤 Characters: ${chars}

━━━━━━━━━━━━━━

📖 Preview:

${preview}

━━━━━━━━━━━━━━

⚠️ PDF is too large to display completely.

📎 Full text has been attached below as a TXT file.`
        }, { quoted: message });

        const txtPath = path.join(
            '/tmp',
            `pdf_text_${Date.now()}.txt`
        );

        fs.writeFileSync(txtPath, extractedText);

        await sock.sendMessage(chatId, {
            document: fs.readFileSync(txtPath),
            mimetype: 'text/plain',
            fileName: 'full_pdf_text.txt',
            caption:
`📄 Full PDF Text

📑 Pages: ${pages}
📝 Words: ${words}
🔤 Characters: ${chars}`
        }, { quoted: message });

        try {
            fs.unlinkSync(txtPath);
        } catch {}

    } catch (error) {
        console.error('OCRPDF Error:', error);

        await sock.sendMessage(chatId, {
            text: '❌ Failed to extract PDF text.'
        }, { quoted: message });
    }
}

module.exports = ocrpdfCommand;
