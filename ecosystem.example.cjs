/**
 * PM2 ecosystem example for multi-customer hosting.
 *
 * Copy to `ecosystem.config.cjs` and edit the customer blocks. Each customer
 * is a separate PM2 process that shares the same codebase + node_modules but
 * writes only to its own DATA_DIR / SESSION_DIR / TEMP_DIR / TMP_DIR /
 * STORE_FILE. Start everything with:  pm2 start ecosystem.config.cjs
 *
 * Each `name` MUST be unique. Each `SESSION_DIR` MUST be unique — never point
 * two processes at the same session folder.
 */

const path = require('path');
const os = require('os');

const BASE = path.resolve(__dirname);
const CUSTOMERS_ROOT = path.join(os.homedir(), 'whatsapp-bots', 'customers');

function customer(name, ownerNumber) {
    const dir = path.join(CUSTOMERS_ROOT, name);
    return {
        name: `${name}-bot`,
        script: path.join(BASE, 'index.js'),
        cwd: BASE,
        env: {
            CUSTOMER_ID: name,
            DATA_DIR: path.join(dir, 'data'),
            SESSION_DIR: path.join(dir, 'session'),
            TEMP_DIR: path.join(dir, 'temp'),
            TMP_DIR: path.join(dir, 'tmp'),
            STORE_FILE: path.join(dir, 'baileys_store.json'),
            OWNER_NUMBER: ownerNumber,
        },
        autorestart: true,
        // PM2 safety net: restart before the OS OOM-killer. Sits above the
        // 700 MB in-app watchdog in index.js so the app's own watchdog fires
        // first (with a clear log line) and PM2 only acts if the app misses it.
        max_memory_restart: '800M',
        exp_backoff_restart_delay: 5000,
    };
}

module.exports = {
    apps: [
        // customer('seth', '2547XXXXXXXX'),
        // customer('brayo', '2547YYYYYYYY'),
        // customer('customer3', '2547ZZZZZZZZ'),
    ],
};
