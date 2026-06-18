const axios = require('axios');
const yts = require('yt-search');

async function playCommand(sock, chatId, message) {
    try {
        const text =
            message.message?.conversation ||
            message.message?.extendedTextMessage?.text ||
            '';

        const query = text.split(' ').slice(1).join(' ').trim();

        if (!query) {
            return sock.sendMessage(
                chatId,
                { text: 'Usage: .play song name' },
                { quoted: message }
            );
        }

        const search = await yts(query);

        if (!search.videos.length) {
            return sock.sendMessage(
                chatId,
                { text: '❌ No results found.' },
                { quoted: message }
            );
        }

        const video = search.videos[0];

        await sock.sendMessage(
            chatId,
            {
                text: `🎵 Found: ${video.title}\n⏳ Downloading...`
            },
            { quoted: message }
        );

        const apiRes = await axios.get(
            `https://mcow.giftedtechnexus.workers.dev/api/yta?url=${encodeURIComponent(video.url)}`,
            { timeout: 60000 }
        );

        const data = apiRes.data;

        if (!data.success || !data.result?.download_url) {
            throw new Error('API download failed');
        }

        await sock.sendMessage(
            chatId,
            {
                audio: { url: data.result.download_url },
                mimetype: 'audio/mpeg',
                fileName: `${video.title}.mp3`
            },
            { quoted: message }
        );

    } catch (error) {
        console.error('Play command error:', error);

        await sock.sendMessage(
            chatId,
            { text: '❌ Failed to download audio.' },
            { quoted: message }
        );
    }
}

module.exports = playCommand;
