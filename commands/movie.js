const axios = require('axios');

async function movieCommand(sock, chatId, message) {
    try {
        const text =
            message.message?.conversation ||
            message.message?.extendedTextMessage?.text ||
            '';

        const query = text.split(' ').slice(1).join(' ').trim();

        if (!query) {
            return await sock.sendMessage(chatId, {
                text:
`🎬 Movie Search

Usage:
.movie Money Heist

Examples:
.movie Avatar
.movie Fast X
.movie Prison Break`
            }, { quoted: message });
        }

        await sock.sendMessage(chatId, {
            text: `🔍 Searching for "${query}"...`
        }, { quoted: message });

        const res = await axios.get(
            `http://www.omdbapi.com/?apikey=742b2d09&t=${encodeURIComponent(query)}&plot=full`
        );

        const data = res.data;

        if (!data || data.Response === 'False') {
            return await sock.sendMessage(chatId, {
                text: `❌ No movie found for "${query}".`
            }, { quoted: message });
        }

        const caption =
`🎬 IMDB MOVIE SEARCH

🎥 Title: ${data.Title}
📅 Year: ${data.Year}
⭐ Rated: ${data.Rated}
📆 Released: ${data.Released}
⏳ Runtime: ${data.Runtime}
🎭 Genre: ${data.Genre}
🎬 Director: ${data.Director}
✍️ Writer: ${data.Writer}
👥 Actors: ${data.Actors}

📝 Plot:
${data.Plot}

🌐 Language: ${data.Language}
🌍 Country: ${data.Country}
🏆 Awards: ${data.Awards}
💰 Box Office: ${data.BoxOffice}
⭐ IMDB Rating: ${data.imdbRating}
🗳️ IMDB Votes: ${data.imdbVotes}

⚡ Powered by Telmass`;

        if (data.Poster && data.Poster !== 'N/A') {
            await sock.sendMessage(chatId, {
                image: { url: data.Poster },
                caption
            }, { quoted: message });
        } else {
            await sock.sendMessage(chatId, {
                text: caption
            }, { quoted: message });
        }

    } catch (error) {
        console.error('Movie Error:', error);

        await sock.sendMessage(chatId, {
            text: '❌ Failed to fetch movie information.'
        }, { quoted: message });
    }
}

module.exports = movieCommand;
