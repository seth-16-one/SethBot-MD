async function langsCommand(sock, chatId, message) {

const text = `🌍 Supported Languages

🌍 African Languages
🇰🇪 sw → Swahili
🇪🇹 am → Amharic
🇸🇴 so → Somali
🇳🇬 ha → Hausa
🇳🇬 ig → Igbo
🇳🇬 yo → Yoruba
🇿🇦 zu → Zulu
🇿🇦 xh → Xhosa
🇷🇼 rw → Kinyarwanda
🇺🇬 lg → Luganda
🇲🇼 ny → Chichewa
🇿🇼 sn → Shona
🇲🇬 mg → Malagasy

🌎 International Languages
🇬🇧 en → English
🇫🇷 fr → French
🇪🇸 es → Spanish
🇩🇪 de → German
🇮🇹 it → Italian
🇵🇹 pt → Portuguese
🇷🇺 ru → Russian
🇨🇳 zh → Chinese
🇯🇵 ja → Japanese
🇰🇷 ko → Korean
🇸🇦 ar → Arabic
🇮🇳 hi → Hindi
🇹🇷 tr → Turkish
🇳🇱 nl → Dutch
🇵🇱 pl → Polish
🇸🇪 sv → Swedish
🇩🇰 da → Danish
🇳🇴 no → Norwegian
🇫🇮 fi → Finnish

📝 Example:
.translate Hello world sw

⚡ Powered by Telmass`;

await sock.sendMessage(chatId, {
    text
}, { quoted: message });

}

module.exports = langsCommand;
