const axios = require('axios');

async function wastalkCommand(sock, chatId, message) {
    try {
        const text =
            message.message?.conversation ||
            message.message?.extendedTextMessage?.text ||
            '';

        const args = text.split(' ').slice(1).join(' ').trim();

        if (!args) {
            return await sock.sendMessage(chatId, {
                text: 'Usage: .wastalk 254712345678'
            }, { quoted: message });
        }

        const digits = args.replace(/[^\d]/g, '');

        if (!digits) {
            return await sock.sendMessage(chatId, {
                text: '❌ Invalid number.'
            }, { quoted: message });
        }

        await sock.sendMessage(chatId, {
            text: `🔍 Investigating +${digits}...`
        }, { quoted: message });

        const jid = digits + '@s.whatsapp.net';

        let onWA = false;
        let isBusiness = false;

        try {
            const result = await sock.onWhatsApp(jid);

            if (result && result.length > 0) {
                onWA = result[0].exists || false;
                isBusiness = result[0].isBusiness || false;
            }
        } catch {}

        let ppUrl = null;
        let ppStatus = '❌ Hidden';

        try {
            ppUrl = await sock.profilePictureUrl(jid, 'image');

            if (ppUrl) {
                ppStatus = '✅ Available';
            }
        } catch {}

        let aboutText = '🔒 Hidden by privacy settings';

        try {
            const status = await sock.fetchStatus(jid);

            console.log('STATUS RESULT:', JSON.stringify(status, null, 2));

            if (typeof status === 'string') {
                aboutText = status;
            } else if (status?.status) {
                aboutText = status.status;
            }
        } catch (e) {
            console.log('STATUS ERROR:', e);
        }

        let country = 'Unknown';
        let countryCode = 'Unknown';
        let carrier = 'Unknown';
        let lineType = 'Unknown';

        try {
            const apiRes = await axios.get(
                'https://api.phonevalidator.com/api/v4/phonesearch',
                {
                    params: {
                        apikey: 'dbc19b10-f34e-4857-b42b-6c12543d42e3',
                        phone: digits,
                        type: 'basic',
                        region: 3
                    },
                    timeout: 10000
                }
            );

            const data = apiRes.data?.PhoneBasic;

            if (data) {
                country = data.Country || country;
                countryCode = data.CountryCode || countryCode;
                carrier = data.PhoneCompany || carrier;
                lineType = data.LineType || lineType;
            }
        } catch {}

        const caption =
`📱 WhatsApp Intelligence Report
━━━━━━━━━━━━━━━━━━━━━━

📞 Number: +${digits}

💬 WhatsApp Registered:
${onWA ? '✅ Yes' : '❌ No'}

🟢 WhatsApp Business:
${isBusiness ? '✅ Yes' : '❌ No'}

📝 About/Bio:
${aboutText}

🖼️ Profile Picture:
${ppStatus}

🌍 Country:
${country} (${countryCode})

🏢 Carrier:
${carrier}

📶 Line Type:
${lineType}

📅 Account Status:
${onWA ? '✅ Active' : '❌ Inactive'}

🤖 WhatsApp JID:
${jid}

🔗 Direct Chat:
https://wa.me/${digits}

━━━━━━━━━━━━━━━━━━━━━━
⚡ Powered By SethBot-MD`;

        if (ppUrl) {
            await sock.sendMessage(chatId, {
                image: { url: ppUrl },
                caption
            }, { quoted: message });
        } else {
            await sock.sendMessage(chatId, {
                text: caption
            }, { quoted: message });
        }

    } catch (error) {
        console.error('Wastalk Error:', error);

        await sock.sendMessage(chatId, {
            text: '❌ Failed to lookup number.'
        }, { quoted: message });
    }
}

module.exports = wastalkCommand;
