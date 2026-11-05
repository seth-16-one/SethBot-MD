/**
 * SESSION_ID handling for session-only deployments (Katabump, Pterodactyl, Heroku, Render, VPS...).
 *
 * SESSION_ID format (produced by the SethBot-MD pairing website):
 *     TELMAS~<base64 of creds.json>
 *
 * applySessionId() validates the ID, writes creds.json into the session folder and reports
 * exactly what happened, so index.js can decide whether to connect.
 *
 * Rules:
 *  - the same SESSION_ID is applied only once: a hash of it is stored in the session folder,
 *    so a restart keeps the (fresher) credentials the bot has saved since;
 *  - a NEW SESSION_ID replaces the old credentials;
 *  - when WhatsApp logs the session out, markDead() remembers that ID is dead, so a restart
 *    does not retry it in a loop; a new SESSION_ID is needed;
 *  - the console prompt / session.txt fallback lives in lib/sessionPrompt.js.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PREFIX = 'TELMAS~';
const HASH_FILE = '.session_hash'; // sha256 of the SESSION_ID currently written to disk
const DEAD_FILE = '.session_dead'; // sha256 of a SESSION_ID WhatsApp has logged out

const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');

function readText(file) {
    try {
        return fs.readFileSync(file, 'utf8').trim();
    } catch {
        return '';
    }
}

/**
 * Tolerant parse: trims, strips wrapping quotes and ANY whitespace/newlines (hosts and
 * copy/paste often wrap long values), finds the prefix and validates the payload.
 * @returns {{ok:true, full:string, creds:object, phone:string} | {ok:false, code:string, error:string}}
 */
function parseSessionId(raw) {
    if (!raw || !String(raw).trim()) return { ok: false, code: 'EMPTY', error: 'SESSION_ID is empty.' };

    let v = String(raw).trim().replace(/^["']+|["']+$/g, '').replace(/\s+/g, '');
    const idx = v.indexOf(PREFIX);
    if (idx === -1) {
        return { ok: false, code: 'PREFIX', error: `SESSION_ID must start with "${PREFIX}" (copy the whole value from the pairing website).` };
    }
    v = v.slice(idx);

    const b64 = v.slice(PREFIX.length);
    if (!b64 || !/^[A-Za-z0-9+/=_-]+$/.test(b64)) {
        return { ok: false, code: 'CHARS', error: 'SESSION_ID contains characters that are not valid base64 — it was probably cut or altered when pasted.' };
    }

    let creds;
    try {
        creds = JSON.parse(Buffer.from(b64.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));
    } catch {
        return { ok: false, code: 'INCOMPLETE', error: 'SESSION_ID could not be decoded — it is incomplete or corrupted. Generate a new one.' };
    }

    if (!creds || typeof creds !== 'object' || Array.isArray(creds)) {
        return { ok: false, code: 'NOTCREDS', error: 'SESSION_ID decoded, but it is not WhatsApp credentials. Generate a new one.' };
    }
    if (!creds.me?.id) {
        return { ok: false, code: 'UNPAIRED', error: 'SESSION_ID does not contain a linked WhatsApp account (unfinished pairing?). Finish pairing on the website, then copy the ID.' };
    }

    return { ok: true, full: v, creds, phone: String(creds.me.id).split(':')[0].split('@')[0] };
}

/** Wipes the folder content except the dead marker (the folder itself stays, so Baileys can reuse it). */
function clearFolder(folder) {
    if (!fs.existsSync(folder)) return;
    for (const name of fs.readdirSync(folder)) {
        if (name === DEAD_FILE) continue;
        try { fs.rmSync(path.join(folder, name), { recursive: true, force: true }); } catch { /* ignore */ }
    }
}

/**
 * @param {string} folder  session folder (SESSION_DIR)
 * @param {string|undefined} raw  the SESSION_ID text
 * @returns {{status:'loaded'|'unchanged'|'invalid'|'missing'|'dead', message?:string, phone?:string}}
 *   loaded    ID written to disk (first run, or a NEW ID was supplied)
 *   unchanged same ID as last time; the existing (fresher) credentials on disk are kept
 *   invalid   ID present but unusable (message says why)
 *   missing   no SESSION_ID given
 *   dead      this exact ID was already logged out by WhatsApp
 */
function applySessionId(folder, raw) {
    fs.mkdirSync(folder, { recursive: true });
    if (!raw || !String(raw).trim()) return { status: 'missing' };

    const parsed = parseSessionId(raw);
    if (!parsed.ok) return { status: 'invalid', message: parsed.error };

    const hash = sha(parsed.full);

    if (readText(path.join(folder, DEAD_FILE)) === hash) {
        return {
            status: 'dead',
            phone: parsed.phone,
            message: 'This SESSION_ID was logged out by WhatsApp. Generate a NEW one and replace it.'
        };
    }

    const credsPath = path.join(folder, 'creds.json');
    if (fs.existsSync(credsPath) && readText(path.join(folder, HASH_FILE)) === hash) {
        return { status: 'unchanged', phone: parsed.phone };
    }

    try {
        clearFolder(folder);
        fs.writeFileSync(credsPath, JSON.stringify(parsed.creds));
        fs.writeFileSync(path.join(folder, HASH_FILE), hash);
    } catch (error) {
        return { status: 'invalid', message: `could not write the session files: ${error.message}` };
    }

    return { status: 'loaded', phone: parsed.phone };
}

/** WhatsApp logged this session out: remember the SESSION_ID in use as dead and clear the credentials. */
function markDead(folder, raw) {
    const parsed = parseSessionId(raw);
    try {
        fs.mkdirSync(folder, { recursive: true });
        clearFolder(folder);
        if (parsed.ok) fs.writeFileSync(path.join(folder, DEAD_FILE), sha(parsed.full));
    } catch { /* best effort */ }
}

/** Force the next start to re-apply SESSION_ID from the environment (used on badSession). */
function forgetLoaded(folder) {
    try { fs.rmSync(path.join(folder, HASH_FILE), { force: true }); } catch { /* ignore */ }
}

module.exports = { parseSessionId, applySessionId, markDead, forgetLoaded, PREFIX, HASH_FILE, DEAD_FILE };
