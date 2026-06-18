const fetch = require('node-fetch');

async function gitstalkCommand(sock, chatId, message) {
    try {
        const text =
            message.message?.conversation ||
            message.message?.extendedTextMessage?.text ||
            '';

        const username = text.split(' ').slice(1).join(' ').trim();

        if (!username) {
            return await sock.sendMessage(chatId, {
                text: 'Usage: .gitstalk username'
            }, { quoted: message });
        }

        const response = await fetch(
            `https://api.github.com/users/${encodeURIComponent(username)}`,
            {
                headers: {
                    'User-Agent': 'SethBot-MD'
                }
            }
        );

        if (response.status === 404) {
            return await sock.sendMessage(chatId, {
                text: `❌ GitHub user "${username}" not found.`
            }, { quoted: message });
        }

        if (!response.ok) {
            return await sock.sendMessage(chatId, {
                text: `❌ GitHub API Error: ${response.status}`
            }, { quoted: message });
        }

        const data = await response.json();

        const caption =
`🐙 *GitHub User Info*

👤 Username: ${data.login || 'N/A'}
📛 Name: ${data.name || 'N/A'}

📝 Bio:
${data.bio || 'N/A'}

📍 Location: ${data.location || 'N/A'}
🏢 Company: ${data.company || 'N/A'}
🌐 Blog: ${data.blog || 'N/A'}

👥 Followers: ${data.followers || 0}
➡️ Following: ${data.following || 0}

📦 Repositories: ${data.public_repos || 0}
📄 Gists: ${data.public_gists || 0}

🔖 Account Type: ${data.type || 'N/A'}

📅 Created:
${data.created_at ? new Date(data.created_at).toDateString() : 'N/A'}

🔗 ${data.html_url}`;

        await sock.sendMessage(chatId, {
            image: { url: data.avatar_url },
            caption
        }, { quoted: message });

    } catch (error) {
        console.error('GitStalk Error:', error);

        await sock.sendMessage(chatId, {
            text: '❌ Failed to fetch GitHub user.'
        }, { quoted: message });
    }
}

module.exports = gitstalkCommand;
