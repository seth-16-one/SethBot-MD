const fs = require('fs');
const path = require('path');
const settings = require('../settings');

async function githubCommand(sock, chatId, message) {
    try {
        let txt = `*乂 ${settings.botName} 乂*\n\n`;

        txt += `✩ *Bot Name* : ${settings.botName}\n`;
        txt += `✩ *Version* : ${settings.version}\n`;
        txt += `✩ *Owner* : ${settings.botOwner}\n`;
        txt += `✩ *Number* : ${settings.ownerNumber}\n`;
        txt += `✩ *Mode* : ${settings.commandMode}\n\n`;

        txt += `📂 *GitHub Repository*\n`;
        txt += `https://github.com/seth-16-one/SethBot-MD\n\n`;

        txt += `🚀 *Features*\n`;
        txt += `• Group Management\n`;
        txt += `• AI Commands\n`;
        txt += `• Media Downloader\n`;
        txt += `• OCR Scanner\n`;
        txt += `• Antilink Protection\n`;
        txt += `• Antidelete System\n`;
        txt += `• Sticker Tools\n`;
        txt += `• Fun Commands\n\n`;

        txt += `💥 *Powered By Seth Tech*`;

        const imgPath = path.join(__dirname, '../assets/bot_image.jpg');
        const imgBuffer = fs.readFileSync(imgPath);

        await sock.sendMessage(
            chatId,
            {
                image: imgBuffer,
                caption: txt
            },
            { quoted: message }
        );

    } catch (error) {
        console.error('GitHub Command Error:', error);

        await sock.sendMessage(
            chatId,
            {
                text: '❌ Failed to load repository information.'
            },
            { quoted: message }
        );
    }
}

module.exports = githubCommand;
