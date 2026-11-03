/**
 * Multi-customer isolation test (no WhatsApp accounts involved).
 *
 * This test does NOT connect to WhatsApp. It verifies that two simulated
 * customers, configured only through environment variables, resolve to:
 *   - different DATA_DIR, SESSION_DIR, TEMP_DIR, TMP_DIR
 *   - different STORE_FILE
 *   - different owner numbers
 *   - isolated message-store contents (one customer's store cannot read the
 *     other's)
 *
 * It also verifies backward compatibility: with no env vars set, the original
 * defaults are used.
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const assert = require('assert');

const ROOT = path.resolve(__dirname, '..');
const TMP_ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'sethbot-isolation-'));

// Node caches modules by resolved path + the require cache. To load
// lib/paths.js / lib/owner.js / lib/lightweight_store.js with DIFFERENT env
// vars for two "customers", we delete them from the require cache between
// runs and re-require them.
function loadCustomerModules(env) {
    // apply env
    for (const [k, v] of Object.entries(env)) {
        if (v === undefined) delete process.env[k]; else process.env[k] = v;
    }
    // purge cached customer-aware modules
    const ids = Object.keys(require.cache).filter(id =>
        id.includes(path.join('lib', 'paths.js')) ||
        id.includes(path.join('lib', 'owner.js')) ||
        id.includes(path.join('lib', 'lightweight_store.js')) ||
        id.includes(path.join('settings.js'))
    );
    for (const id of ids) delete require.cache[id];

    const paths = require(path.join(ROOT, 'lib', 'paths.js'));
    const owner = require(path.join(ROOT, 'lib', 'owner.js'));
    const store = require(path.join(ROOT, 'lib', 'lightweight_store.js'));
    const settings = require(path.join(ROOT, 'settings.js'));

    // Resolve owner NOW, while this customer's env is active. In production
    // each customer is a separate process, so its env never changes; here we
    // capture the resolved values so later assertions are not affected by the
    // next customer's env overwriting process.env.
    const primaryOwner = owner.getPrimaryOwnerNumber();
    const ownerNumbers = owner.getOwnerNumbers();
    const isOwner = (jid) => owner.isOwnerNumber(jid);
    return { paths, owner, store, settings, primaryOwner, ownerNumbers, isOwner };
}

function restoreEnv(snapshot) {
    for (const k of ['CUSTOMER_ID','DATA_DIR','SESSION_DIR','TEMP_DIR','TMP_DIR','STORE_FILE','OWNER_NUMBER']) {
        delete process.env[k];
    }
    for (const [k, v] of Object.entries(snapshot)) {
        if (v === undefined) delete process.env[k]; else process.env[k] = v;
    }
}

function run() {
    const envSnapshot = {};
    for (const k of ['CUSTOMER_ID','DATA_DIR','SESSION_DIR','TEMP_DIR','TMP_DIR','STORE_FILE','OWNER_NUMBER']) {
        envSnapshot[k] = process.env[k];
    }

    const customers = {
        seth: {
            CUSTOMER_ID: 'seth',
            DATA_DIR: path.join(TMP_ROOT, 'customers', 'seth', 'data'),
            SESSION_DIR: path.join(TMP_ROOT, 'customers', 'seth', 'session'),
            TEMP_DIR: path.join(TMP_ROOT, 'customers', 'seth', 'temp'),
            TMP_DIR: path.join(TMP_ROOT, 'customers', 'seth', 'tmp'),
            STORE_FILE: path.join(TMP_ROOT, 'customers', 'seth', 'baileys_store.json'),
            OWNER_NUMBER: '254711111111',
        },
        brayo: {
            CUSTOMER_ID: 'brayo',
            DATA_DIR: path.join(TMP_ROOT, 'customers', 'brayo', 'data'),
            SESSION_DIR: path.join(TMP_ROOT, 'customers', 'brayo', 'session'),
            TEMP_DIR: path.join(TMP_ROOT, 'customers', 'brayo', 'temp'),
            TMP_DIR: path.join(TMP_ROOT, 'customers', 'brayo', 'tmp'),
            STORE_FILE: path.join(TMP_ROOT, 'customers', 'brayo', 'baileys_store.json'),
            OWNER_NUMBER: '254722222222',
        },
    };

    const results = { seth: null, brayo: null };

    // Load both customers
    for (const [name, env] of Object.entries(customers)) {
        results[name] = loadCustomerModules(env);
    }

    let failures = 0;
    function check(label, cond) {
        try {
            assert.ok(cond, label);
            console.log(`  ✅ ${label}`);
        } catch (e) {
            console.error(`  ❌ ${e.message}`);
            failures++;
        }
    }

    console.log('\n=== Test 1: customers resolve to different data/session/temp/tmp/store ===');
    const s = results.seth.paths;
    const b = results.brayo.paths;
    check('DATA_DIR differ', s.DATA_DIR !== b.DATA_DIR);
    check('SESSION_DIR differ', s.SESSION_DIR !== b.SESSION_DIR);
    check('TEMP_DIR differ', s.TEMP_DIR !== b.TEMP_DIR);
    check('TMP_DIR differ', s.TMP_DIR !== b.TMP_DIR);
    check('STORE_FILE differ', s.STORE_FILE !== b.STORE_FILE);
    check('CUSTOMER_ID seth = seth', s.CUSTOMER_ID === 'seth');
    check('CUSTOMER_ID brayo = brayo', b.CUSTOMER_ID === 'brayo');

    console.log('\n=== Test 2: resolved dirs match the configured env values ===');
    check('seth DATA_DIR == env', s.DATA_DIR === customers.seth.DATA_DIR);
    check('seth SESSION_DIR == env', s.SESSION_DIR === customers.seth.SESSION_DIR);
    check('seth TEMP_DIR == env', s.TEMP_DIR === customers.seth.TEMP_DIR);
    check('seth TMP_DIR == env', s.TMP_DIR === customers.seth.TMP_DIR);
    check('seth STORE_FILE == env', s.STORE_FILE === customers.seth.STORE_FILE);
    check('brayo DATA_DIR == env', b.DATA_DIR === customers.brayo.DATA_DIR);

    console.log('\n=== Test 3: customer dirs were created on load ===');
    check('seth data dir exists', fs.existsSync(s.DATA_DIR));
    check('seth session dir exists', fs.existsSync(s.SESSION_DIR));
    check('seth temp dir exists', fs.existsSync(s.TEMP_DIR));
    check('seth tmp dir exists', fs.existsSync(s.TMP_DIR));
    check('brayo data dir exists', fs.existsSync(b.DATA_DIR));
    check('brayo session dir exists', fs.existsSync(b.SESSION_DIR));

    console.log('\n=== Test 4: owner resolution per customer ===');
    check('seth primary owner = 254711111111', results.seth.primaryOwner === '254711111111');
    check('brayo primary owner = 254722222222', results.brayo.primaryOwner === '254722222222');
    check('seth isOwnerNumber(254711111111) true', results.seth.isOwner('254711111111@s.whatsapp.net') === true);
    check('seth isOwnerNumber(254722222222) false', results.seth.isOwner('254722222222@s.whatsapp.net') === false);
    check('brayo isOwnerNumber(254722222222) true', results.brayo.isOwner('254722222222@s.whatsapp.net') === true);
    check('brayo isOwnerNumber(254711111111) false', results.brayo.isOwner('254711111111@s.whatsapp.net') === false);
    check('seth settings.ownerNumber overridden', results.seth.settings.ownerNumber === '254711111111');
    check('brayo settings.ownerNumber overridden', results.brayo.settings.ownerNumber === '254722222222');

    console.log('\n=== Test 5: message store isolation (one customer cannot read the other) ===');
    // seth writes a message into seth's store
    const sethStore = results.seth.store;
    sethStore.messages = {};
    sethStore.contacts = {};
    sethStore.messages['seth-chat@s.whatsapp.net'] = [{ key: { id: 'seth-msg-1', remoteJid: 'seth-chat@s.whatsapp.net' }, message: { conversation: 'seth secret' } }];
    sethStore.writeToFile(customers.seth.STORE_FILE);

    // brayo writes a message into brayo's store
    const brayoStore = results.brayo.store;
    brayoStore.messages = {};
    brayoStore.contacts = {};
    brayoStore.messages['brayo-chat@s.whatsapp.net'] = [{ key: { id: 'brayo-msg-1', remoteJid: 'brayo-chat@s.whatsapp.net' }, message: { conversation: 'brayo secret' } }];
    brayoStore.writeToFile(customers.brayo.STORE_FILE);

    check('seth store file exists', fs.existsSync(customers.seth.STORE_FILE));
    check('brayo store file exists', fs.existsSync(customers.brayo.STORE_FILE));
    check('store files differ', customers.seth.STORE_FILE !== customers.brayo.STORE_FILE);

    // Re-read seth's store fresh and ensure it does NOT contain brayo's message
    const sethRaw = JSON.parse(fs.readFileSync(customers.seth.STORE_FILE, 'utf-8'));
    const brayoRaw = JSON.parse(fs.readFileSync(customers.brayo.STORE_FILE, 'utf-8'));
    check('seth store has seth-chat', !!sethRaw.messages['seth-chat@s.whatsapp.net']);
    check('seth store lacks brayo-chat', !sethRaw.messages['brayo-chat@s.whatsapp.net']);
    check('brayo store has brayo-chat', !!brayoRaw.messages['brayo-chat@s.whatsapp.net']);
    check('brayo store lacks seth-chat', !brayoRaw.messages['seth-chat@s.whatsapp.net']);

    console.log('\n=== Test 6: backward compatibility (no env vars => defaults) ===');
    restoreEnv(envSnapshot);
    for (const k of Object.keys(customers.seth)) delete process.env[k];
    const def = loadCustomerModules({});
    check('default DATA_DIR == ./data', def.paths.DATA_DIR === path.resolve(ROOT, 'data'));
    check('default SESSION_DIR == ./session', def.paths.SESSION_DIR === path.resolve(ROOT, 'session'));
    check('default TEMP_DIR == ./temp', def.paths.TEMP_DIR === path.resolve(ROOT, 'temp'));
    check('default TMP_DIR == ./tmp', def.paths.TMP_DIR === path.resolve(ROOT, 'tmp'));
    check('default STORE_FILE == ./baileys_store.json', def.paths.STORE_FILE === path.resolve(ROOT, 'baileys_store.json'));
    check('default CUSTOMER_ID == default', def.paths.CUSTOMER_ID === 'default');
    // With no env and the repo's data/owner.json (["254717246928"]), owner should
    // resolve from owner.json (or fall back to settings.ownerNumber).
    const defaultOwnerNumber = require(path.join(ROOT, 'settings.js')).ownerNumber;
    check('default owner resolved from owner.json/settings', def.primaryOwner === '254717246928' || def.primaryOwner === defaultOwnerNumber);

    console.log('\n=== Test 7: owner.json is read and never overwritten ===');
    // Create a customer dir with a custom owner.json
    const cust = path.join(TMP_ROOT, 'ownerjson-test');
    fs.mkdirSync(path.join(cust, 'data'), { recursive: true });
    fs.writeFileSync(path.join(cust, 'data', 'owner.json'), JSON.stringify(['254733333333']));
    const ownerEnv = {
        DATA_DIR: path.join(cust, 'data'),
        SESSION_DIR: path.join(cust, 'session'),
        TEMP_DIR: path.join(cust, 'temp'),
        TMP_DIR: path.join(cust, 'tmp'),
        STORE_FILE: path.join(cust, 'baileys_store.json'),
    };
    const m = loadCustomerModules(ownerEnv);
    check('owner.json read -> 254733333333', m.primaryOwner === '254733333333');
    check('owner.json not overwritten by bot', fs.readFileSync(path.join(cust, 'data', 'owner.json'), 'utf-8') === JSON.stringify(['254733333333']));

    restoreEnv(envSnapshot);
    console.log(`\n=== RESULT: ${failures === 0 ? 'ALL TESTS PASSED ✅' : failures + ' FAILURE(S) ❌'} ===`);
    return failures;
}

try {
    const failures = run();
    process.exit(failures === 0 ? 0 : 1);
} catch (e) {
    console.error('Test harness crashed:', e);
    process.exit(2);
}
