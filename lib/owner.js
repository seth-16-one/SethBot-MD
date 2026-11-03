/**
 * Per-customer owner resolution.
 *
 * The owner of a customer's bot is determined, in priority order, from:
 *   1. The OWNER_NUMBER environment variable (comma-separated list allowed).
 *   2. The customer's `${DATA_DIR}/owner.json` file (array or string).
 *      This file is only ever READ here — it is never created or overwritten
 *      by the bot, so an existing customer's owner.json is always preserved.
 *   3. The `ownerNumber` field in settings.js (backward-compat fallback).
 *
 * As a side effect of the first resolve, the shared `settings.ownerNumber`
 * string is replaced with the customer's primary owner number. All existing
 * code that reads `settings.ownerNumber` (owner.js, sudo.js, github.js,
 * isOwner.js, ...) therefore automatically honors the customer's owner
 * without needing per-file changes.
 */
const fs = require('fs');
const path = require('path');
const settings = require('../settings');
const { DATA_DIR } = require('./paths');

let _ownerNumbers = null;   // Array<string> of owner numbers (digits only)
let _primaryOwner = null;   // string (digits only)

function cleanNumber(value) {
    if (value === undefined || value === null) return '';
    return String(value).trim().replace(/[^0-9]/g, '');
}

function readOwnerJson() {
    try {
        const ownerPath = path.join(DATA_DIR, 'owner.json');
        if (!fs.existsSync(ownerPath)) return null;
        return JSON.parse(fs.readFileSync(ownerPath, 'utf-8'));
    } catch (e) {
        console.warn(`[owner] Could not read ${path.join(DATA_DIR, 'owner.json')}: ${e.message}`);
        return null;
    }
}

function resolveOwnerNumbers() {
    if (_ownerNumbers) return _ownerNumbers;

    const owners = [];

    // 1. OWNER_NUMBER env var (highest priority, matches index.js legacy logic)
    if (process.env.OWNER_NUMBER && String(process.env.OWNER_NUMBER).trim()) {
        for (const part of String(process.env.OWNER_NUMBER).split(',')) {
            const n = cleanNumber(part);
            if (n && !owners.includes(n)) owners.push(n);
        }
    }

    // 2. owner.json in the customer's DATA_DIR (never written by the bot)
    if (owners.length === 0) {
        const parsed = readOwnerJson();
        if (Array.isArray(parsed)) {
            for (const item of parsed) {
                const n = cleanNumber(item);
                if (n && !owners.includes(n)) owners.push(n);
            }
        } else if (typeof parsed === 'string') {
            const n = cleanNumber(parsed);
            if (n) owners.push(n);
        } else if (parsed && typeof parsed === 'object') {
            // tolerate { number: "..." } / { ownerNumber: "..." } shapes
            const n = cleanNumber(parsed.number || parsed.ownerNumber);
            if (n) owners.push(n);
        }
    }

    // 3. Fall back to settings.ownerNumber
    if (owners.length === 0) {
        const n = cleanNumber(settings.ownerNumber);
        if (n) owners.push(n);
    }

    _ownerNumbers = owners;
    _primaryOwner = owners[0] || cleanNumber(settings.ownerNumber);

    // Override the shared settings string so legacy code paths see the
    // customer's owner without each one being edited.
    if (_primaryOwner) {
        settings.ownerNumber = _primaryOwner;
    }

    return _ownerNumbers;
}

function getOwnerNumbers() {
    return resolveOwnerNumbers();
}

function getPrimaryOwnerNumber() {
    resolveOwnerNumbers();
    return _primaryOwner;
}

/**
 * Returns true if the provided JID or number belongs to one of this
 * customer's owners. Accepts both full JIDs ("2547...@s.whatsapp.net",
 * "2547...:75@lid") and bare numbers ("2547...").
 */
function isOwnerNumber(jidOrNumber) {
    const owners = resolveOwnerNumbers();
    if (!owners.length || !jidOrNumber) return false;
    const numeric = String(jidOrNumber).split(':')[0].split('@')[0];
    return owners.includes(numeric);
}

module.exports = {
    resolveOwnerNumbers,
    getOwnerNumbers,
    getPrimaryOwnerNumber,
    isOwnerNumber,
};
