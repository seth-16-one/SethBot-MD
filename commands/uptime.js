const os = require('os');
const settings = require('../settings');

function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    return `${days}d ${hours}h ${minutes}m`;
}

async function uptimeCommand(sock, chatId, message) {
    const uptime = formatUptime(process.uptime());

    const text = `🤖 *${settings.botName}*

⏳ Uptime: ${uptime}
📦 Version: ${settings.version}
👤 Owner: ${settings.botOwner}
🟢 Status: Online`;

    await sock.sendMessage(chatId, {
        text
    }, { quoted: message });
}

module.exports = uptimeCommand;
