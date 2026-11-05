/**
 * SethBot-MD - A WhatsApp Bot
 * Copyright (c) 2026 Seth Tech
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the MIT License.
 * 
 * Credits:
 * - Baileys Library by @adiwajshing
 * - Pair Code implementation inspired by TechGod143 & DGXEON
 */
try { require('dotenv').config({ quiet: true }) } catch { /* optional */ }
require('./settings')
const { Boom } = require('@hapi/boom')
const fs = require('fs')
const chalk = require('chalk')
const FileType = require('file-type')
const path = require('path')
const axios = require('axios')

// Resolve per-customer paths and owner BEFORE loading main.js so that every
// module which reads `settings.ownerNumber` or a customer directory sees this
// customer's values.
const { DATA_DIR, SESSION_DIR, STORE_FILE, CUSTOMER_ID } = require('./lib/paths')
const { getPrimaryOwnerNumber } = require('./lib/owner')
// SESSION_ID deployment (same system as VORTE-PRO):
//   SESSION_ID env var -> creds.json in SESSION_DIR (lib/sessionLoader.js)
//   no/invalid SESSION_ID -> paste it in the console, or put it in session.txt (lib/sessionPrompt.js)
const sessionLoader = require('./lib/sessionLoader')
const { acquireSession } = require('./lib/sessionPrompt')
const { startHealthServer, setStatus } = require('./lib/healthServer')
const QR_ENABLED = process.env.ENABLE_QR === 'true'
let reconnectAttempts = 0
let reconnectTimer = null

const { handleMessages, handleGroupParticipantUpdate, handleStatus } = require('./main');
const PhoneNumber = require('awesome-phonenumber')
const { imageToWebp, videoToWebp, writeExifImg, writeExifVid } = require('./lib/exif')
const { smsg, isUrl, generateMessageTag, getBuffer, getSizeMedia, fetch, await, sleep, reSize } = require('./lib/myfunc')
const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    generateForwardMessageContent,
    prepareWAMessageMedia,
    generateWAMessageFromContent,
    generateMessageID,
    downloadContentFromMessage,
    jidDecode,
    proto,
    jidNormalizedUser,
    makeCacheableSignalKeyStore,
    delay
} = require("baileys")
const NodeCache = require("node-cache")
// Using a lightweight persisted store instead of makeInMemoryStore (compat across versions)
const pino = require("pino")
const readline = require("readline")
const { parsePhoneNumber } = require("libphonenumber-js")
const { rmSync, existsSync } = require('fs')
const { join } = require('path')

// Import lightweight store
const store = require('./lib/lightweight_store')

// Initialize store from this customer's STORE_FILE (lib/paths.js resolves the
// STORE_FILE env var, defaulting to ./baileys_store.json for single-customer
// deployments). Only this customer's messages/contacts are loaded.
store.readFromFile(STORE_FILE)
const settings = require('./settings')
setInterval(() => store.writeToFile(STORE_FILE), settings.storeWriteInterval || 10000)

// Memory optimization - Force garbage collection if available
setInterval(() => {
    if (global.gc) {
        global.gc()
        console.log('🧹 Garbage collection completed')
    }
}, 60_000) // every 1 minute

// Memory monitoring - Restart if RAM gets too high
setInterval(() => {
    const used = process.memoryUsage().rss / 1024 / 1024
    if (used > 400) {
        console.log('⚠️ RAM too high (>400MB), restarting bot...')
        process.exit(1) // Panel will auto-restart
    }
}, 30_000) // check every 30 seconds

// Default phone number used only as a last-resort fallback for the pairing
// prompt. The actual owner used by the bot is resolved per-customer below.
let phoneNumber = process.env.OWNER_NUMBER || "254717246928"
// DATA_DIR is resolved per-customer from lib/paths.js (DATA_DIR env var).

// Resolve this customer's owner number(s). lib/owner.js overrides
// settings.ownerNumber with the customer's primary owner so that all legacy
// code paths (isOwner.js, owner.js, sudo.js, github.js, ...) honor it.
const owner = getPrimaryOwnerNumber() || phoneNumber

console.log(chalk.cyan(`[customer] id="${CUSTOMER_ID}" data="${DATA_DIR}" session="${SESSION_DIR}" store="${STORE_FILE}" owner="${owner}"`))

global.botname = "SETH BOT"
global.themeemoji = "•"
const pairingCode = process.argv.includes("--pairing-code")
const useMobile = process.argv.includes("--mobile")

// Only create this readline interface for the optional --pairing-code flow in a real terminal.
// (The SESSION_ID console prompt in lib/sessionPrompt.js reads stdin on its own; two readers would clash.)
const rl = (pairingCode && process.stdin.isTTY) ? readline.createInterface({ input: process.stdin, output: process.stdout }) : null
const question = (text) => {
    if (rl) {
        return new Promise((resolve) => rl.question(text, resolve))
    } else {
        // Non-interactive (e.g. PM2): use this customer's resolved owner.
        // lib/owner.js has already overridden settings.ownerNumber with the
        // customer's primary owner (from OWNER_NUMBER / owner.json).
        return Promise.resolve(settings.ownerNumber || owner)
    }
}


/** One reconnect at a time; a failed attempt schedules the next one (growing delay) instead of crashing. */
function scheduleReconnect(delayMs) {
    if (reconnectTimer) return // one is already pending
    reconnectTimer = setTimeout(async () => {
        reconnectTimer = null
        try {
            await startXeonBotInc()
        } catch (e) {
            console.error('❌ Reconnect failed:', e.message)
            reconnectAttempts++
            scheduleReconnect(Math.min(5000 * 2 ** reconnectAttempts, 60000))
        }
    }, delayMs + Math.random() * 1000)
}

async function startXeonBotInc() {
    try {
        // Local login flows (QR / --pairing-code) skip the SESSION_ID requirement.
        const localLogin = QR_ENABLED || pairingCode
        const hasSavedCreds = fs.existsSync(path.join(SESSION_DIR, 'creds.json'))

        // Apply SESSION_ID BEFORE Baileys reads the auth folder. Uses SESSION_ID / saved credentials;
        // otherwise asks for the ID in the console, or reads session.txt next to index.js.
        const sessionLoad = await acquireSession(SESSION_DIR, process.env, {
            allowPrompt: !localLogin && process.env.SESSION_PROMPT !== 'false',
            hasSavedCreds
        })

        if (sessionLoad.status === 'loaded') {
            console.log(chalk.green(`📦 SESSION_ID loaded for +${sessionLoad.phone}.`))
        } else if (sessionLoad.status === 'unchanged') {
            console.log(chalk.green(`📦 SESSION_ID unchanged (+${sessionLoad.phone}) — using saved credentials.`))
        }

        // Nothing usable: stay idle (web server keeps running) instead of crash-looping against WhatsApp.
        const stop = (lines) => {
            console.error('\n' + lines.map((l) => '❌ ' + l).join('\n') + '\n')
            setStatus('needs-session')
        }
        if (sessionLoad.status === 'invalid') return stop([`SESSION_ID problem: ${sessionLoad.message}`, 'Fix the SESSION_ID variable (or session.txt) and restart.'])
        if (sessionLoad.status === 'dead') return stop([sessionLoad.message])
        const nowHasCreds = fs.existsSync(path.join(SESSION_DIR, 'creds.json'))
        if (sessionLoad.status === 'missing' && !nowHasCreds && !localLogin) {
            return stop([
                'No SESSION_ID was provided, so there is nothing to log in with.',
                'Set the SESSION_ID variable, paste it into the console, or put it in a session.txt file next to index.js — then restart.',
                '(For local testing only, ENABLE_QR=true prints a QR code instead.)'
            ])
        }

        setStatus('connecting')
        let { version, isLatest } = await fetchLatestBaileysVersion()
        // SESSION_DIR is resolved per-customer from lib/paths.js (SESSION_DIR
        // env var). Reconnection reuses the same customer session; another
        // customer's session is never touched because each process resolves
        // its own SESSION_DIR.
        const sessionDir = SESSION_DIR
        const { state, saveCreds } = await useMultiFileAuthState(sessionDir)
        const msgRetryCounterCache = new NodeCache()

        const XeonBotInc = makeWASocket({
            version,
            logger: pino({ level: 'silent' }),
            browser: ["Ubuntu", "Chrome", "20.0.04"],
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
            },
            markOnlineOnConnect: true,
            generateHighQualityLinkPreview: true,
            syncFullHistory: false,
            getMessage: async (key) => {
                let jid = jidNormalizedUser(key.remoteJid)
                let msg = await store.loadMessage(jid, key.id)
                return msg?.message || ""
            },
            msgRetryCounterCache,
            defaultQueryTimeoutMs: 60000,
            connectTimeoutMs: 60000,
            keepAliveIntervalMs: 10000,
        })

        // Save credentials when they update
        XeonBotInc.ev.on('creds.update', saveCreds)

    store.bind(XeonBotInc.ev)

    // Message handling
    XeonBotInc.ev.on('messages.upsert', async chatUpdate => {
        try {
            const mek = chatUpdate.messages[0]
            if (!mek.message) return
            mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message
            if (mek.key && mek.key.remoteJid === 'status@broadcast') {
                await handleStatus(XeonBotInc, chatUpdate);
                return;
            }
            // In private mode, only block non-group messages (allow groups for moderation)
            // Note: XeonBotInc.public is not synced, so we check mode in main.js instead
            // This check is kept for backward compatibility but mainly blocks DMs
            if (!XeonBotInc.public && !mek.key.fromMe && chatUpdate.type === 'notify') {
                const isGroup = mek.key?.remoteJid?.endsWith('@g.us')
                if (!isGroup) return // Block DMs in private mode, but allow group messages
            }
            if (mek.key.id.startsWith('BAE5') && mek.key.id.length === 16) return

            // Clear message retry cache to prevent memory bloat
            if (XeonBotInc?.msgRetryCounterCache) {
                XeonBotInc.msgRetryCounterCache.clear()
            }

            try {
                await handleMessages(XeonBotInc, chatUpdate, true)
            } catch (err) {
                console.error("Error in handleMessages:", err)
                // Only try to send error message if we have a valid chatId
                if (mek.key && mek.key.remoteJid) {
                    await XeonBotInc.sendMessage(mek.key.remoteJid, {
                        text: '❌ An error occurred while processing your message.'
                    }).catch(console.error);
                }
            }
        } catch (err) {
            console.error("Error in messages.upsert:", err)
        }
    })

    // Add these event handlers for better functionality
    XeonBotInc.decodeJid = (jid) => {
        if (!jid) return jid
        if (/:\d+@/gi.test(jid)) {
            let decode = jidDecode(jid) || {}
            return decode.user && decode.server && decode.user + '@' + decode.server || jid
        } else return jid
    }

    XeonBotInc.ev.on('contacts.update', update => {
        for (let contact of update) {
            let id = XeonBotInc.decodeJid(contact.id)
            if (store && store.contacts) store.contacts[id] = { id, name: contact.notify }
        }
    })

    XeonBotInc.getName = (jid, withoutContact = false) => {
        id = XeonBotInc.decodeJid(jid)
        withoutContact = XeonBotInc.withoutContact || withoutContact
        let v
        if (id.endsWith("@g.us")) return new Promise(async (resolve) => {
            v = store.contacts[id] || {}
            if (!(v.name || v.subject)) v = XeonBotInc.groupMetadata(id) || {}
            resolve(v.name || v.subject || PhoneNumber('+' + id.replace('@s.whatsapp.net', '')).getNumber('international'))
        })
        else v = id === '0@s.whatsapp.net' ? {
            id,
            name: 'WhatsApp'
        } : id === XeonBotInc.decodeJid(XeonBotInc.user.id) ?
            XeonBotInc.user :
            (store.contacts[id] || {})
        return (withoutContact ? '' : v.name) || v.subject || v.verifiedName || PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international')
    }

    XeonBotInc.public = true

    XeonBotInc.serializeM = (m) => smsg(XeonBotInc, m, store)

    // Handle pairing code
    if (pairingCode && !XeonBotInc.authState.creds.registered) {
        if (useMobile) throw new Error('Cannot use pairing code with mobile api')

        let phoneNumber
        if (!!global.phoneNumber) {
            phoneNumber = global.phoneNumber
        } else {
            phoneNumber = await question(chalk.bgBlack(chalk.greenBright(`Please type your WhatsApp number 😍\nFormat: 6281376552730 (without + or spaces) : `)))
        }

        // Clean the phone number - remove any non-digit characters
        phoneNumber = phoneNumber.replace(/[^0-9]/g, '')

        // Validate the phone number using awesome-phonenumber
        const pn = require('awesome-phonenumber');
        if (!pn('+' + phoneNumber).isValid()) {
            console.log(chalk.red('Invalid phone number. Please enter your full international number (e.g., 15551234567 for US, 447911123456 for UK, etc.) without + or spaces.'));
            process.exit(1);
        }

        setTimeout(async () => {
            try {
                let code = await XeonBotInc.requestPairingCode(phoneNumber)
                code = code?.match(/.{1,4}/g)?.join("-") || code
                console.log(chalk.black(chalk.bgGreen(`Your Pairing Code : `)), chalk.black(chalk.white(code)))
                console.log(chalk.yellow(`\nPlease enter this code in your WhatsApp app:\n1. Open WhatsApp\n2. Go to Settings > Linked Devices\n3. Tap "Link a Device"\n4. Enter the code shown above`))
            } catch (error) {
                console.error('Error requesting pairing code:', error)
                console.log(chalk.red('Failed to get pairing code. Please check your phone number and try again.'))
            }
        }, 3000)
    }

    // Connection handling
    XeonBotInc.ev.on('connection.update', async (s) => {
        const { connection, lastDisconnect, qr } = s
        
        if (qr) {
            if (QR_ENABLED) {
                // Baileys 7 no longer prints the QR by itself: render it in the terminal (local testing only).
                console.log(chalk.yellow('\n📷 Scan this QR with WhatsApp → Linked Devices → Link a Device:\n'))
                require('qrcode-terminal').generate(qr, { small: true })
            } else if (!pairingCode) {
                console.error(chalk.red('❌ WhatsApp is asking for a new login (QR) — the saved session is not valid. Generate a new SESSION_ID. (Set ENABLE_QR=true to print QR codes.)'))
            }
        }
        
        if (connection === 'connecting') {
            console.log(chalk.yellow('🔄 Connecting to WhatsApp...'))
        }
        
        if (connection == "open") {
            reconnectAttempts = 0
            setStatus('online', String(XeonBotInc.user?.id || '').split(':')[0])
            console.log(chalk.magenta(` `))
            console.log(chalk.yellow(`🌿Connected to => ` + JSON.stringify(XeonBotInc.user, null, 2)))

            try {
                const botNumber = XeonBotInc.user.id.split(':')[0] + '@s.whatsapp.net';
                await XeonBotInc.sendMessage(botNumber, {
                    text: `🤖 Bot Connected Successfully!\n\n⏰ Time: ${new Date().toLocaleString()}\n✅ Status: Online and Ready!\n\n📢 Join our channel:\nhttps://whatsapp.com/channel/0029VauzXsXGOj9gh3gGOz27`
                });
            } catch (error) {
                console.error('Error sending connection message:', error.message)
            }

            await delay(1999)
            console.log(chalk.yellow(`\n\n                  ${chalk.bold.blue(`[ ${global.botname || 'SETH BOT'} ]`)}\n\n`))
            console.log(chalk.cyan(`< ================================================== >`))
            console.log(chalk.magenta(`\n${global.themeemoji || '•'} YT CHANNEL: Seth Tech`))
            console.log(chalk.magenta(`${global.themeemoji || '•'} GITHUB: seth-16-one`))
            console.log(chalk.magenta(`${global.themeemoji || '•'} WA NUMBER: ${owner}`))
            console.log(chalk.magenta(`${global.themeemoji || '•'} CREDIT: Seth Tech`))
            console.log(chalk.green(`${global.themeemoji || '•'} 🤖 Bot Connected Successfully! ✅`))
            console.log(chalk.blue(`Bot Version: ${settings.version}`))
        }
        
        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode
            console.log(chalk.red(`🔌 Connection closed (Code: ${statusCode}): ${lastDisconnect?.error}`))

            // Cases where reconnecting is pointless or harmful:
            if (statusCode === DisconnectReason.loggedOut || statusCode === 401 || statusCode === 403) {
                // Clears the credentials and remembers the SESSION_ID in use as dead, so a restart
                // does not retry it in a loop. A new SESSION_ID is needed.
                sessionLoader.markDead(sessionDir, process.env.SESSION_ID)
                setStatus('logged-out')
                console.error(chalk.red('❌ WhatsApp logged this session out (or banned it). Generate a NEW SESSION_ID, set it, and restart. Not reconnecting.'))
                return
            }
            if (statusCode === DisconnectReason.connectionReplaced) { // 440
                setStatus('replaced')
                console.error(chalk.red('❌ This session was opened somewhere else (same SESSION_ID running on another host/instance). Stop the other one — not reconnecting, to avoid a fight.'))
                return
            }
            if (statusCode === DisconnectReason.badSession) { // 500: corrupted local state -> rebuild from SESSION_ID
                console.error(chalk.yellow('⚠️ Local session state was corrupted — rebuilding from SESSION_ID.'))
                sessionLoader.forgetLoaded(sessionDir)
            }

            // Everything else (incl. 515 restart-after-pairing): reconnect with a growing delay.
            setStatus('reconnecting')
            const wait = statusCode === DisconnectReason.restartRequired ? 1000 : Math.min(5000 * 2 ** reconnectAttempts, 60000)
            reconnectAttempts++
            console.log(chalk.yellow(`🔄 Reconnecting in ${Math.round(wait / 1000)}s...`))
            // retire the dead socket so its listeners can never fire again, then reconnect exactly once
            try { XeonBotInc.ev.removeAllListeners(); XeonBotInc.end(undefined) } catch { /* already closed */ }
            scheduleReconnect(wait)
        }
    })

    // Track recently-notified callers to avoid spamming messages
    const antiCallNotified = new Set();

    // Anticall handler: block callers when enabled
    XeonBotInc.ev.on('call', async (calls) => {
        try {
            const { readState: readAnticallState } = require('./commands/anticall');
            const state = readAnticallState();
            if (!state.enabled) return;
            for (const call of calls) {
                const callerJid = call.from || call.peerJid || call.chatId;
                if (!callerJid) continue;
                try {
                    // First: attempt to reject the call if supported
                    try {
                        if (typeof XeonBotInc.rejectCall === 'function' && call.id) {
                            await XeonBotInc.rejectCall(call.id, callerJid);
                        } else if (typeof XeonBotInc.sendCallOfferAck === 'function' && call.id) {
                            await XeonBotInc.sendCallOfferAck(call.id, callerJid, 'reject');
                        }
                    } catch {}

                    // Notify the caller only once within a short window
                    if (!antiCallNotified.has(callerJid)) {
                        antiCallNotified.add(callerJid);
                        setTimeout(() => antiCallNotified.delete(callerJid), 60000);
                        await XeonBotInc.sendMessage(callerJid, { text: '📵 Anticall is enabled. Your call was rejected and you will be blocked.' });
                    }
                } catch {}
                // Then: block after a short delay to ensure rejection and message are processed
                setTimeout(async () => {
                    try { await XeonBotInc.updateBlockStatus(callerJid, 'block'); } catch {}
                }, 800);
            }
        } catch (e) {
            // ignore
        }
    });

    XeonBotInc.ev.on('group-participants.update', async (update) => {
        await handleGroupParticipantUpdate(XeonBotInc, update);
    });

    XeonBotInc.ev.on('messages.upsert', async (m) => {
        if (m.messages[0].key && m.messages[0].key.remoteJid === 'status@broadcast') {
            await handleStatus(XeonBotInc, m);
        }
    });

    XeonBotInc.ev.on('status.update', async (status) => {
        await handleStatus(XeonBotInc, status);
    });

    XeonBotInc.ev.on('messages.reaction', async (status) => {
        await handleStatus(XeonBotInc, status);
    });

    return XeonBotInc
    } catch (error) {
        console.error('Error in startXeonBotInc:', error)
        reconnectAttempts++
        scheduleReconnect(Math.min(5000 * 2 ** reconnectAttempts, 60000))
    }
}


// Web server for hosts that need an open port (Heroku/Render/Docker panels) and uptime pings
startHealthServer(settings.botName || 'SethBot-MD')

// Start the bot with error handling
startXeonBotInc().catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
})
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err)
})

process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err)
})

let file = require.resolve(__filename)
fs.watchFile(file, () => {
    fs.unwatchFile(file)
    console.log(chalk.redBright(`Update ${__filename}`))
    delete require.cache[file]
    require(file)
})
