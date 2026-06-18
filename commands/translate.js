const fetch = require('node-fetch');

async function handleTranslateCommand(sock, chatId, message, match) {
    try {
        await sock.presenceSubscribe(chatId);
        await sock.sendPresenceUpdate('composing', chatId);

        let textToTranslate = '';
        let lang = '';
        let detectedLang = 'AUTO';

        const quotedMessage =
            message.message?.extendedTextMessage?.contextInfo?.quotedMessage;

        if (quotedMessage) {
            textToTranslate =
                quotedMessage.conversation ||
                quotedMessage.extendedTextMessage?.text ||
                quotedMessage.imageMessage?.caption ||
                quotedMessage.videoMessage?.caption ||
                '';

            lang = match.trim().toLowerCase();
        } else {
            const args = match.trim().split(' ');

            if (args.length < 2) {
                return sock.sendMessage(chatId, {
                    text:
`🌍 TRANSLATOR

Usage:

Reply to a message:
.translate sw

Or:

.translate Hello how are you sw

Examples:
.translate Good morning fr
.translate Welcome to Telmass sw
.translate Hello ar

Popular Languages:
sw = Swahili
en = English
fr = French
es = Spanish
de = German
it = Italian
pt = Portuguese
ru = Russian
ja = Japanese
ko = Korean
zh = Chinese
ar = Arabic
hi = Hindi`
                }, { quoted: message });
            }

            lang = args.pop().toLowerCase();
            textToTranslate = args.join(' ');
        }

        if (!textToTranslate) {
            return sock.sendMessage(chatId, {
                text: '❌ No text found to translate.'
            }, { quoted: message });
        }

        let translatedText = null;

        // Google Translate
        try {
            const response = await fetch(
                `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${lang}&dt=t&q=${encodeURIComponent(textToTranslate)}`
            );

            if (response.ok) {
                const data = await response.json();

                if (data?.[0]?.[0]?.[0]) {
                    translatedText = data[0][0][0];
                }

                if (data?.[2]) {
                    detectedLang = data[2].toUpperCase();
                }
            }
        } catch {}

        // MyMemory fallback
        if (!translatedText) {
            try {
                const response = await fetch(
                    `https://api.mymemory.translated.net/get?q=${encodeURIComponent(textToTranslate)}&langpair=auto|${lang}`
                );

                if (response.ok) {
                    const data = await response.json();

                    if (data?.responseData?.translatedText) {
                        translatedText = data.responseData.translatedText;
                    }
                }
            } catch {}
        }

        // Dreaded API fallback
        if (!translatedText) {
            try {
                const response = await fetch(
                    `https://api.dreaded.site/api/translate?text=${encodeURIComponent(textToTranslate)}&lang=${lang}`
                );

                if (response.ok) {
                    const data = await response.json();

                    if (data?.translated) {
                        translatedText = data.translated;
                    }
                }
            } catch {}
        }

        if (!translatedText) {
            throw new Error('All translation APIs failed');
        }

        await sock.sendMessage(chatId, {
            text:
`🌍 Translation

📝 Original:
${textToTranslate}

━━━━━━━━━━━━━━

✅ Translation:
${translatedText}

━━━━━━━━━━━━━━

🔎 Detected:
${detectedLang}

🌐 Translated To:
${lang.toUpperCase()}

⚡ Powered by Telmass`
        }, { quoted: message });

    } catch (error) {
        console.error('Translate Error:', error);

        await sock.sendMessage(chatId, {
            text:
`❌ Translation failed.

Examples:
.translate Hello world sw

Or reply to a message:

.translate sw`
        }, { quoted: message });
    }
}

module.exports = {
    handleTranslateCommand
};
