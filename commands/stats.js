const os = require('os');

async function statsCommand(sock, chatId, message) {
    const uptime = process.uptime();

    const txt = `📊 *Server Stats*

🖥 Host: ${os.hostname()}
⚙ Platform: ${os.platform()}
💾 RAM: ${(os.totalmem() / 1024 / 1024 / 1024).toFixed(1)} GB
📈 Free RAM: ${(os.freemem() / 1024 / 1024 / 1024).toFixed(1)} GB
🔥 CPU Cores: ${os.cpus().length}

⏱ Bot Uptime: ${Math.floor(uptime / 60)} minutes`;

    await sock.sendMessage(
        chatId,
        { text: txt },
        { quoted: message }
    );
}

module.exports = statsCommand;
