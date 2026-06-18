const axios = require('axios');
const yts = require('yt-search');

async function videoCommand(sock, chatId, message) {
    try {
        const text =
            message.message?.conversation ||
            message.message?.extendedTextMessage?.text ||
            '';

        const query = text.split(' ').slice(1).join(' ').trim();

        if (!query) {
            return sock.sendMessage(
                chatId,
                { text: 'Usage: .video song name or youtube link' },
                { quoted: message }
            );
        }

        let videoUrl;
        let videoTitle;

        if (query.match(/youtube\.com|youtu\.be/i)) {
            videoUrl = query;
            videoTitle = 'YouTube Video';
        } else {
            const search = await yts(query);

            if (!search.videos.length) {
                return sock.sendMessage(
                    chatId,
                    { text: '❌ No videos found.' },
                    { quoted: message }
                );
            }

            videoUrl = search.videos[0].url;
            videoTitle = search.videos[0].title;
        }

        await sock.sendMessage(
            chatId,
            {
                text: `🎬 Found: ${videoTitle}\n⏳ Downloading...`
            },
            { quoted: message }
        );

        const apiRes = await axios.get(
            `https://iamtkm.vercel.app/downloaders/ytmp4?apikey=tkm&url=${encodeURIComponent(videoUrl)}`,
            { timeout: 60000 }
        );

        const data = apiRes.data;

        if (!data.status || !data.data?.url) {
            throw new Error('Video API failed');
        }

        const downloadUrl = data.data.url;
        const finalTitle = data.data.title || videoTitle;

        await sock.sendMessage(
            chatId,
            {
                video: { url: downloadUrl },
                mimetype: 'video/mp4',
                caption: `🎬 ${finalTitle}\n\n> Downloaded by SethBot-MD`
            },
            { quoted: message }
        );

    } catch (error) {
        console.error('Video command error:', error);

        await sock.sendMessage(
            chatId,
            { text: '❌ Failed to download video.' },
            { quoted: message }
        );
    }
}

module.exports = videoCommand;
