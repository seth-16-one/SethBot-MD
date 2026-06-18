const os = require('os');
const { execSync } = require('child_process');

async function vpsCommand(sock, chatId, message) {
    try {
        const totalMem = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
        const freeMem = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
        const usedMem = (totalMem - freeMem).toFixed(2);

        const uptime = os.uptime();
        const days = Math.floor(uptime / 86400);
        const hours = Math.floor((uptime % 86400) / 3600);
        const mins = Math.floor((uptime % 3600) / 60);

        const cpu = os.cpus()[0].model;

        let disk = 'Unknown';
        try {
            disk = execSync("df -h / | awk 'NR==2 {print $3\" / \"$2\" (\"$5\")\"}'")
                .toString()
                .trim();
        } catch {}

        const msg =
`🖥️ VPS STATUS

💻 CPU:
${cpu}

🧠 RAM:
${usedMem} GB / ${totalMem} GB

💾 Disk:
${disk}

⏳ Uptime:
${days}d ${hours}h ${mins}m

🟢 Platform:
${os.platform()}

⚡ Powered by Telmass`;

        await sock.sendMessage(chatId, {
            text: msg
        }, { quoted: message });

    } catch (err) {
        console.error(err);

        await sock.sendMessage(chatId, {
            text: '❌ Failed to get VPS stats.'
        }, { quoted: message });
    }
}

module.exports = vpsCommand;
