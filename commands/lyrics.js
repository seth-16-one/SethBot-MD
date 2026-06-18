const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function lyricsCommand(sock, chatId, songTitle, message) {
    try {
        if (!songTitle) {
            return await sock.sendMessage(chatId, {
                text:
`🎵 Lyrics Search

Usage:
.lyrics Shape Of You

Example:
.lyrics Perfect
.lyrics Calm Down`
            }, { quoted: message });
        }

        await sock.sendMessage(chatId, {
            text: `🔍 Searching lyrics for "${songTitle}"...`
        }, { quoted: message });

        const suggestRes = await axios.get(
            `https://api.lyrics.ovh/suggest/${encodeURIComponent(songTitle)}`
        );

        const hit = suggestRes.data?.data?.[0];

        if (!hit) {
            return await sock.sendMessage(chatId, {
                text: `❌ No lyrics found for "${songTitle}".`
            }, { quoted: message });
        }

        const artist = hit.artist?.name || 'Unknown Artist';
        const title = hit.title || songTitle;

        const lyricsRes = await axios.get(
            `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`
        );

        const lyrics = lyricsRes.data?.lyrics;

        if (!lyrics) {
            return await sock.sendMessage(chatId, {
                text: `❌ Lyrics not found for "${title}".`
            }, { quoted: message });
        }

        const formatted =
`🎵 SONG LYRICS

🎤 Artist: ${artist}
🎶 Title: ${title}

━━━━━━━━━━━━━━

${lyrics}

━━━━━━━━━━━━━━

⚡ Powered by Telmass`;

        if (formatted.length < 3500) {
            return await sock.sendMessage(chatId, {
                text: formatted
            }, { quoted: message });
        }

        const preview = formatted.slice(0, 3000);

        await sock.sendMessage(chatId, {
            text:
`${preview}

━━━━━━━━━━━━━━

📄 Lyrics too long.
Full lyrics attached below.`
        }, { quoted: message });

        const txtPath = path.join(
            '/tmp',
            `lyrics_${Date.now()}.txt`
        );

        fs.writeFileSync(txtPath, formatted);

        await sock.sendMessage(chatId, {
            document: fs.readFileSync(txtPath),
            mimetype: 'text/plain',
            fileName: `${title}.txt`
        }, { quoted: message });

        try {
            fs.unlinkSync(txtPath);
        } catch {}

    } catch (error) {
        console.error('Lyrics Error:', error);

        await sock.sendMessage(chatId, {
            text: '❌ Failed to fetch lyrics. Try another song.'
        }, { quoted: message });
    }
}

module.exports = { lyricsCommand };
