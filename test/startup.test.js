/**
 * Real-startup test (no real WhatsApp account).
 *
 * Spawns `node index.js` as a subprocess with a full set of customer env vars
 * and a fake OWNER_NUMBER. We capture stdout for a few seconds and verify:
 *   1. The process boots without an immediate module-load crash.
 *   2. It prints the per-customer startup banner containing the resolved
 *      CUSTOMER_ID, DATA_DIR, SESSION_DIR, STORE_FILE and the fake owner.
 *
 * We then kill the process before it can complete the WhatsApp handshake
 * (the connection attempt itself is fine — it won't succeed without a real
 * number and we never provide pairing input). No real WhatsApp accounts are
 * used.
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const TMP_ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'sethbot-startup-'));

const env = {
    ...process.env,
    CUSTOMER_ID: 'startup-test',
    DATA_DIR: path.join(TMP_ROOT, 'data'),
    SESSION_DIR: path.join(TMP_ROOT, 'session'),
    TEMP_DIR: path.join(TMP_ROOT, 'temp'),
    TMP_DIR: path.join(TMP_ROOT, 'tmp'),
    STORE_FILE: path.join(TMP_ROOT, 'baileys_store.json'),
    OWNER_NUMBER: '254700000000',
    // Force non-interactive (no pairing-code prompt) so the process doesn't
    // wait on stdin.
    CI: '1',
};

const proc = spawn(process.execPath, [path.join(ROOT, 'index.js')], {
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
});

let out = '';
let err = '';
let bannerSeen = false;
let dataEvents = 0;
const FAIL_TIMEOUT = 30000;

console.log('[test] spawned index.js pid=' + proc.pid);

const timeout = setTimeout(() => {
    if (!bannerSeen) {
        console.error(`❌ Timeout: customer banner not seen within ${FAIL_TIMEOUT}ms (data events=${dataEvents})`);
        console.error('--- captured stdout ---\n' + out);
        console.error('--- captured stderr ---\n' + err);
    }
    try { proc.kill('SIGKILL'); } catch {}
    process.exit(bannerSeen ? 0 : 1);
}, FAIL_TIMEOUT);

proc.stdout.on('data', d => {
    dataEvents++;
    out += d.toString();
    if (/customer.*id="startup-test"/.test(out) && /owner="254700000000"/.test(out)) {
        bannerSeen = true;
        // Banner seen — we're done. Kill the bot process (it will keep trying
        // to connect to WhatsApp otherwise) and report success.
        try { proc.kill('SIGKILL'); } catch {}
    }
});
proc.stderr.on('data', d => { err += d.toString(); });

proc.on('error', e => {
    clearTimeout(timeout);
    console.error('❌ Failed to spawn:', e.message);
    process.exit(1);
});

proc.on('exit', (code, signal) => {
    clearTimeout(timeout);
    let failures = 0;
    function check(label, cond) {
        if (cond) { console.log(`  ✅ ${label}`); } else { console.error(`  ❌ ${label}`); failures++; }
    }

    const lines = [];
    lines.push('\n=== Startup test: index.js with customer env vars ===');
    function check2(label, cond) {
        lines.push(cond ? `  ✅ ${label}` : `  ❌ ${label}`);
        if (!cond) failures++;
    }
    check2('process exited cleanly or was killed by us', code === null || code === 0 || code === 1 || signal === 'SIGKILL');
    check2('customer banner printed', /customer.*id="startup-test"/.test(out));
    check2('banner shows DATA_DIR = configured path', out.includes(`data="${env.DATA_DIR}"`));
    check2('banner shows SESSION_DIR = configured path', out.includes(`session="${env.SESSION_DIR}"`));
    check2('banner shows STORE_FILE = configured path', out.includes(`store="${env.STORE_FILE}"`));
    check2('banner shows owner = 254700000000', out.includes('owner="254700000000"'));
    check2('no module-load crash (Cannot find module not in stdout)', !/Cannot find module/.test(out + err));

    lines.push(`\n=== RESULT: ${failures === 0 ? 'STARTUP TEST PASSED ✅' : failures + ' FAILURE(S) ❌'} ===`);
    // Write to a file AND stdout so we always have the result.
    const report = lines.join('\n') + '\n\n--- captured stdout (first 800 chars) ---\n' + out.slice(0, 800);
    fs.writeFileSync(path.join(os.tmpdir(), 'sethbot-startup-report.txt'), report);
    process.stdout.write(report + '\n');
    process.exit(failures === 0 ? 0 : 1);
});
