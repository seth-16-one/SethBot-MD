/**
 * Centralized customer path resolution.
 *
 * Every customer-specific piece of data (WhatsApp session, message store,
 * settings, temp media, ...) is stored under a directory that is unique to
 * that customer. The directories are selected through environment variables
 * so that a single shared codebase + node_modules tree can host any number of
 * customers, each running as its own PM2 process.
 *
 * Supported environment variables:
 *   CUSTOMER_ID  - human-readable label for logs (default: "default")
 *   DATA_DIR     - per-customer persistent data (config, counters, sudo, ...)
 *   SESSION_DIR  - per-customer Baileys auth/session folder
 *   TEMP_DIR     - per-customer working temp (download/transcode scratch)
 *   TMP_DIR      - per-customer media cache (antidelete, sticker, ...)
 *   STORE_FILE   - per-customer Baileys message-store JSON file
 *
 * When a variable is not provided the existing default (relative to the
 * current working directory) is used so single-customer deployments keep
 * working exactly as before.
 */
const fs = require('fs');
const path = require('path');

/**
 * Resolve a directory from an environment variable, falling back to a
 * default path that is resolved relative to process.cwd() for backward
 * compatibility with the original single-customer layout.
 */
function resolveDir(envVar, defaultRelative) {
    const value = process.env[envVar];
    if (value && String(value).trim()) {
        return path.resolve(String(value).trim());
    }
    return path.resolve(defaultRelative);
}

/**
 * Resolve a file path from an environment variable with a default that is
 * resolved relative to process.cwd().
 */
function resolveFile(envVar, defaultRelative) {
    const value = process.env[envVar];
    if (value && String(value).trim()) {
        return path.resolve(String(value).trim());
    }
    return path.resolve(defaultRelative);
}

const CUSTOMER_ID = (process.env.CUSTOMER_ID && String(process.env.CUSTOMER_ID).trim()) || 'default';

const DATA_DIR = resolveDir('DATA_DIR', './data');
const SESSION_DIR = resolveDir('SESSION_DIR', './session');
const TEMP_DIR = resolveDir('TEMP_DIR', './temp');
const TMP_DIR = resolveDir('TMP_DIR', './tmp');
const STORE_FILE = resolveFile('STORE_FILE', './baileys_store.json');

/**
 * Ensure a directory exists, creating it (and parents) if needed.
 * Errors are swallowed so module load never crashes the process; callers
 * that depend on the directory should still handle write errors.
 */
function ensureDir(dir) {
    try {
        fs.mkdirSync(dir, { recursive: true });
    } catch (e) {
        // Ignore EEXIST and permission issues at load time; surface them later
        // through the actual file operations that need the directory.
    }
}

// Pre-create the customer directories so the rest of the codebase can write
// into them without each call site having to mkdir first.
ensureDir(DATA_DIR);
ensureDir(SESSION_DIR);
ensureDir(TEMP_DIR);
ensureDir(TMP_DIR);
ensureDir(path.dirname(STORE_FILE));

module.exports = {
    CUSTOMER_ID,
    DATA_DIR,
    SESSION_DIR,
    TEMP_DIR,
    TMP_DIR,
    STORE_FILE,
    resolveDir,
    resolveFile,
    ensureDir,
};
