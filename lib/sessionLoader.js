/**
 * SESSION_ID deployment for SethBot-MD.
 *
 * Reads the SESSION_ID (environment variable, or a session.txt file next to index.js),
 * decodes it and writes creds.json into the session folder before the bot connects.
 * Pairing website: the SETHBOT~... string it generates.
 *
 * Rules:
 *  - the same SESSION_ID is applied only once: a hash of it is stored in the session folder,
 *    so a restart keeps the (fresher) credentials the bot has saved since;
 *  - a NEW SESSION_ID replaces the old credentials;
 *  - when WhatsApp logs the session out, markDead() remembers that ID is dead, so a restart
 *    does not try it again in a loop; a new SESSION_ID is needed;
 *  - no SESSION_ID at all: nothing changes, the bot behaves as before (existing folder / QR / pairing code).
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PREFIX = 'TELMAS~';
const HASH_FILE = '.session_hash';
const DEAD_FILE = '.session_dead';

const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');

function readText(file) {
    try {
        return fs.readFileSync(file, 'utf8').trim();
    } catch {
        return '';
    }
}

/** Tolerant parse: trims, strips quotes/whitespace, finds the prefix, validates the payload. */
function parseSessionId(raw) {
    if (typeof raw !== 'string' || !raw.trim()) return { ok: false, error: 'empty' };

    const cleaned = raw.trim().replace(/^["']+|["']+$/g, '').replace(/\s+/g, '');
    const at = cleaned.indexOf(PREFIX);
    if (at === -1) return { ok: false, error: `SESSION_ID does not start with "${PREFIX}"` };

    const b64 = cleaned.slice(at + PREFIX.length);
    if (!b64 || !/^[A-Za-z0-9+/=_-]+$/.test(b64)) {
        return { ok: false, error: 'SESSION_ID contains characters that are not valid base64' };
    }

    try {
        const creds = JSON.parse(Buffer.from(b64.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));
        if (!creds || typeof creds !== 'object' || !creds.me?.id) {
            return { ok: false, error: 'SESSION_ID does not contain a linked WhatsApp account' };
        }
        return { ok: true, creds, full: PREFIX + b64 };
    } catch {
        return { ok: false, error: 'SESSION_ID could not be decoded: it is incomplete or corrupted' };
    }
}

function readRawSessionId(env, sessionFile) {
    const fromEnv = String(env.SESSION_ID || '').trim();
    return fromEnv || (sessionFile ? readText(sessionFile) : '');
}

/** Wipes the folder content except the dead marker (the folder itself stays, so Baileys can reuse it). */
function clearFolder(folder) {
    if (!fs.existsSync(folder)) return;
    for (const name of fs.readdirSync(folder)) {
        if (name === DEAD_FILE) continue;
        fs.rmSync(path.join(folder, name), { recursive: true, force: true });
    }
}

/**
 * @returns {{ status: 'loaded'|'unchanged'|'missing'|'invalid'|'dead', phone?: string, message?: string }}
 *   loaded    a new SESSION_ID was written to the session folder
 *   unchanged the folder already holds this session (or there is no SESSION_ID but credentials exist)
 *   missing   no SESSION_ID and no credentials: the normal QR / pairing-code flow applies
 *   invalid   the SESSION_ID cannot be used: fix it
 *   dead      WhatsApp logged this SESSION_ID out: a new one is needed
 */
function acquireSession(folder, env = process.env, options = {}) {
    const raw = readRawSessionId(env, options.sessionFile);
    const credsFile = path.join(folder, 'creds.json');

    if (!raw) {
        return fs.existsSync(credsFile) ? { status: 'unchanged' } : { status: 'missing' };
    }

    const parsed = parseSessionId(raw);
    if (!parsed.ok) {
        return { status: 'invalid', message: parsed.error };
    }

    const hash = sha(parsed.full);

    if (readText(path.join(folder, DEAD_FILE)) === hash) {
        return {
            status: 'dead',
            message: 'This SESSION_ID was logged out from WhatsApp. Generate a new one and set it as SESSION_ID.'
        };
    }

    if (fs.existsSync(credsFile) && readText(path.join(folder, HASH_FILE)) === hash) {
        return { status: 'unchanged', phone: String(parsed.creds.me.id).split(':')[0].split('@')[0] };
    }

    try {
        fs.mkdirSync(folder, { recursive: true });
        clearFolder(folder);
        fs.writeFileSync(credsFile, JSON.stringify(parsed.creds));
        fs.writeFileSync(path.join(folder, HASH_FILE), hash);
    } catch (error) {
        return { status: 'invalid', message: `could not write the session files: ${error.message}` };
    }

    return { status: 'loaded', phone: String(parsed.creds.me.id).split(':')[0].split('@')[0] };
}

/** WhatsApp logged the session out: remember the SESSION_ID in use as dead and clear the credentials. */
function markDead(folder, rawSessionId) {
    const parsed = parseSessionId(String(rawSessionId || ''));

    fs.mkdirSync(folder, { recursive: true });
    clearFolder(folder);

    if (parsed.ok) {
        fs.writeFileSync(path.join(folder, DEAD_FILE), sha(parsed.full));
    }
}

module.exports = { acquireSession, markDead, parseSessionId, readRawSessionId, PREFIX, HASH_FILE, DEAD_FILE };
