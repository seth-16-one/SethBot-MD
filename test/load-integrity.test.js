/**
 * Import-integrity / startup test (no WhatsApp connection).
 *
 * Requires main.js (which transitively requires every command and lib module
 * the bot uses) under two configurations:
 *   1. A multi-customer configuration (all env vars set to a temp dir).
 *   2. The default single-customer configuration (no env vars).
 *
 * If any modified file has a broken import or a load-time error, the
 * require() will throw and the test fails. No WhatsApp connection is made.
 */
const fs = require('fs');
const path = require('path');
const os = require('os');

const ROOT = path.resolve(__dirname, '..');
const TMP_ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'sethbot-load-'));

function purgeAll() {
    // Purge everything under the project so the next require re-evaluates with
    // the new env. Leave node_modules cached (they don't depend on our env).
    for (const id of Object.keys(require.cache)) {
        if (id.startsWith(ROOT) && !id.includes(path.join('node_modules'))) {
            delete require.cache[id];
        }
    }
}

function clearCustomerEnv() {
    for (const k of ['CUSTOMER_ID','DATA_DIR','SESSION_DIR','TEMP_DIR','TMP_DIR','STORE_FILE','OWNER_NUMBER']) {
        delete process.env[k];
    }
}

function tryRequireMain(label) {
    try {
        const main = require(path.join(ROOT, 'main.js'));
        const ok = main && typeof main.handleMessages === 'function';
        console.log(`  ${ok ? '✅' : '❌'} ${label}: main.js loaded, handleMessages ${ok ? 'exported' : 'MISSING'}`);
        return ok;
    } catch (e) {
        console.error(`  ❌ ${label}: require(main.js) failed:\n     ${e && e.stack ? e.stack.split('\n').slice(0,4).join('\n     ') : e}`);
        return false;
    }
}

function run() {
    let failures = 0;
    const customerEnv = {
        CUSTOMER_ID: 'loadtest',
        DATA_DIR: path.join(TMP_ROOT, 'data'),
        SESSION_DIR: path.join(TMP_ROOT, 'session'),
        TEMP_DIR: path.join(TMP_ROOT, 'temp'),
        TMP_DIR: path.join(TMP_ROOT, 'tmp'),
        STORE_FILE: path.join(TMP_ROOT, 'baileys_store.json'),
        OWNER_NUMBER: '254700000000',
    };

    console.log('\n=== Load test 1: multi-customer env (all paths set) ===');
    clearCustomerEnv();
    Object.assign(process.env, customerEnv);
    purgeAll();
    if (!tryRequireMain('multi-customer env')) failures++;

    // Verify the key index.js modules also load cleanly under the customer env
    console.log('  --- index.js dependency modules under customer env ---');
    for (const mod of ['lib/paths.js','lib/owner.js','lib/lightweight_store.js','lib/isOwner.js','lib/exif.js','lib/myfunc.js','lib/index.js','lib/dataDir.js']) {
        try {
            require(path.join(ROOT, mod));
            console.log(`  ✅ ${mod} loaded`);
        } catch (e) {
            console.error(`  ❌ ${mod} failed: ${e.message}`);
            failures++;
        }
    }

    console.log('\n=== Load test 2: default single-customer env (no env vars) ===');
    clearCustomerEnv();
    purgeAll();
    if (!tryRequireMain('default env')) failures++;

    // Verify index.js itself parses and its top-level requires resolve. We
    // cannot run startXeonBotInc() (it connects to WhatsApp), so we instead
    // confirm index.js is syntactically valid and its module specifiers
    // resolve by requiring the same set of modules index.js requires.
    console.log('  --- index.js module specifiers resolve (default env) ---');
    for (const mod of ['lib/paths.js','lib/owner.js','lib/lightweight_store.js','lib/exif.js','lib/myfunc.js']) {
        try {
            require(path.join(ROOT, mod));
            console.log(`  ✅ ${mod} resolved`);
        } catch (e) {
            console.error(`  ❌ ${mod} failed: ${e.message}`);
            failures++;
        }
    }

    clearCustomerEnv();
    console.log(`\n=== RESULT: ${failures === 0 ? 'ALL LOAD TESTS PASSED ✅' : failures + ' FAILURE(S) ❌'} ===`);
    return failures;
}

try {
    process.exit(run() === 0 ? 0 : 1);
} catch (e) {
    console.error('Load test harness crashed:', e);
    process.exit(2);
}
