const yts = require('yt-search');
const ytdl = require('@distube/ytdl-core');

async function playCommand(sock, chatId, message) {
try {
const text =
message.message?.conversation ||
message.message?.extendedTextMessage?.text ||
'';

    const query = text.split(' ').slice(1).join(' ').trim();

    if (!query) {
        return await sock.sendMessage(chatId, {
            text: 'Usage: .play song name'
        });
    }

    const search = await yts(query);

    if (!search.videos.length) {
        return await sock.sendMessage(chatId, {
            text: 'No results found.'
        });
    }

    const video = search.videos[0];

    await sock.sendMessage(chatId, {
        text: `🎵 Downloading: ${video.title}`
    });

    try {
        const info = await ytdl.getInfo(video.url);

        const format = ytdl.chooseFormat(info.formats, {
            quality: 'highestaudio'
        });

        await sock.sendMessage(
            chatId,
            {
                audio: { url: format.url },
                mimetype: 'audio/mpeg',
                fileName: `${video.title}.mp3`
            },
            { quoted: message }
        );
    } catch (err) {
        console.error('YTDL Error:', err);

        await sock.sendMessage(chatId, {
            text: '❌ This video is blocked by YouTube or unavailable.'
        });
    }

} catch (error) {
    console.error('Play command error:', error);

    await sock.sendMessage(chatId, {
        text: '❌ Download failed.'
    });
}

}

module.exports = playCommand;
