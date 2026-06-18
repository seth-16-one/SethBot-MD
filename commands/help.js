const settings = require('../settings');
const fs = require('fs');
const path = require('path');

async function helpCommand(sock, chatId, message) {
const helpMessage = `
╔══════════════════════╗
🤖 *${settings.botName || 'SethBot-MD'}*
⚡ Version: ${settings.version || '3.0.7'}
👑 Owner: ${settings.botOwner || 'Seth Tech'}
📺 YouTube: ${global.ytch}
╚══════════════════════╝

╔══════════════════════╗
🌐 *GENERAL*
║ ➤ .help / .menu
║ ➤ .ping
║ ➤ .alive
║ ➤ .owner
║ ➤ .jid
║ ➤ .url
║ ➤ .weather <city>
║ ➤ .news
║ ➤ .quote
║ ➤ .fact
║ ➤ .joke
║ ➤ .groupinfo
║ ➤ .staff
║ ➤ .admins
╚══════════════════════╝

╔══════════════════════╗
🔍 *SEARCH & STALK*
║ ➤ .gitstalk <user>
║ ➤ .wastalk <number>
║ ➤ .movie <name>
║ ➤ .lyrics <song>
║ ➤ .github
║ ➤ .repo
║ ➤ .script
╚══════════════════════╝

╔══════════════════════╗
🛠️ *TOOLS*
║ ➤ .translate
║ ➤ .trt
║ ➤ .langs
║ ➤ .ocr
║ ➤ .ocrpdf
║ ➤ .tts <text>
║ ➤ .ss <url>
║ ➤ .vv
║ ➤ .vv2
╚══════════════════════╝

╔══════════════════════╗
📥 *DOWNLOADERS*
║ ➤ .play <song>
║ ➤ .song <song>
║ ➤ .spotify <query>
║ ➤ .video <song>
║ ➤ .ytmp4 <url>
║ ➤ .facebook <url>
║ ➤ .instagram <url>
║ ➤ .tiktok <url>
╚══════════════════════╝

╔══════════════════════╗
🎨 *MEDIA*
║ ➤ .sticker
║ ➤ .take
║ ➤ .blur
║ ➤ .crop
║ ➤ .removebg
║ ➤ .remini
║ ➤ .simage
║ ➤ .meme
║ ➤ .tgsticker
║ ➤ .emojimix
╚══════════════════════╝

╔══════════════════════╗
🤖 *AI*
║ ➤ .gpt
║ ➤ .gemini
║ ➤ .imagine
║ ➤ .flux
║ ➤ .sora
╚══════════════════════╝

╔══════════════════════╗
👮 *GROUP ADMIN*
║ ➤ .ban
║ ➤ .kick
║ ➤ .warn
║ ➤ .warnings
║ ➤ .promote
║ ➤ .demote
║ ➤ .mute
║ ➤ .unmute
║ ➤ .delete
║ ➤ .tag
║ ➤ .tagall
║ ➤ .tagnotadmin
║ ➤ .hidetag
║ ➤ .antilink
║ ➤ .antitag
║ ➤ .welcome
║ ➤ .goodbye
╚══════════════════════╝

╔══════════════════════╗
🎮 *GAMES*
║ ➤ .tictactoe
║ ➤ .hangman
║ ➤ .guess
║ ➤ .trivia
║ ➤ .answer
║ ➤ .truth
║ ➤ .dare
║ ➤ .8ball
╚══════════════════════╝

╔══════════════════════╗
🎭 *FUN*
║ ➤ .compliment
║ ➤ .insult
║ ➤ .flirt
║ ➤ .shayari
║ ➤ .goodnight
║ ➤ .roseday
║ ➤ .ship
║ ➤ .simp
║ ➤ .character
║ ➤ .stupid
╚══════════════════════╝

╔══════════════════════╗
🔤 *TEXT MAKER*
║ ➤ .metallic
║ ➤ .ice
║ ➤ .snow
║ ➤ .matrix
║ ➤ .light
║ ➤ .neon
║ ➤ .devil
║ ➤ .purple
║ ➤ .thunder
║ ➤ .glitch
║ ➤ .fire
╚══════════════════════╝

╔══════════════════════╗
🖼️ *ANIME*
║ ➤ .nom
║ ➤ .poke
║ ➤ .cry
║ ➤ .kiss
║ ➤ .pat
║ ➤ .hug
║ ➤ .wink
║ ➤ .facepalm
╚══════════════════════╝

╔══════════════════════╗
🔒 *OWNER*
║ ➤ .mode
║ ➤ .settings
║ ➤ .update
║ ➤ .clearsession
║ ➤ .cleartmp
║ ➤ .autoreact
║ ➤ .autoread
║ ➤ .autotyping
║ ➤ .autostatus
║ ➤ .anticall
║ ➤ .pmblocker
║ ➤ .setmention
║ ➤ .mention
║ ➤ .vps
╚══════════════════════╝

📢 Join our channel for updates
🔗 https://whatsapp.com/channel/0029VauzXsXGOj9gh3gGOz27
⚡ SethBot-MD • Powered by Telmass
`;

try {
const imagePath = path.join(__dirname, '../assets/bot_image.jpg');

if (fs.existsSync(imagePath)) {
const imageBuffer = fs.readFileSync(imagePath);

await sock.sendMessage(chatId, {
image: imageBuffer,
caption: helpMessage,
contextInfo: {
forwardingScore: 1,
isForwarded: true
}
}, { quoted: message });

} else {
await sock.sendMessage(chatId, {
text: helpMessage
}, { quoted: message });
}

} catch (error) {
console.error('Help Error:', error);
await sock.sendMessage(chatId, {
text: helpMessage
}, { quoted: message });
}
}

module.exports = helpCommand;

