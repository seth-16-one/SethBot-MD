/**
 * SESSION_ID loader + console/file prompt tests (no WhatsApp, no network).
 * Run: node test/session.test.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { PassThrough } = require('stream');

const loader = require('../lib/sessionLoader');
const { promptForSessionId, acquireSession } = require('../lib/sessionPrompt');

let pass = 0, fail = 0;
const check = (name, ok, detail) => {
    ok ? pass++ : fail++;
    console.log(`  ${ok ? '✅' : '❌'} ${name}${ok ? '' : ' -> ' + (detail ?? '')}`);
};

const creds = (n = 1) => ({ noiseKey: { private: 'a' }, registrationId: n, me: { id: '254700000001:12@s.whatsapp.net' } });
const mk = (c = creds()) => loader.PREFIX + Buffer.from(JSON.stringify(c)).toString('base64');
const dir = () => fs.mkdtempSync(path.join(os.tmpdir(), 'sethsess-'));
const io = () => {
    const input = new PassThrough(), output = new PassThrough();
    let text = '';
    output.on('data', (d) => (text += d));
    return { input, output, text: () => text };
};
const tick = () => new Promise((r) => setTimeout(r, 20));
const id = mk();

(async () => {
    console.log('[parseSessionId / applySessionId]');
    check('prefix is TELMAS~', loader.PREFIX === 'TELMAS~');
    check('valid ID parses', loader.parseSessionId(id).ok);
    check('quotes + line breaks are tolerated', loader.parseSessionId(`"${id.slice(0, 20)}\n${id.slice(20)}"`).ok);
    check('wrong prefix rejected', loader.parseSessionId('VORTE_PRO~abc').code === 'PREFIX');
    check('cut ID reported as incomplete', loader.parseSessionId(id.slice(0, -9)).code === 'INCOMPLETE');
    check('non-credentials rejected', loader.parseSessionId(loader.PREFIX + Buffer.from('{"a":1}').toString('base64')).code === 'UNPAIRED');

    let d = dir();
    let r = loader.applySessionId(d, id);
    check('first apply = loaded, creds.json written', r.status === 'loaded' && fs.existsSync(path.join(d, 'creds.json')) && r.phone === '254700000001');
    fs.writeFileSync(path.join(d, 'creds.json'), JSON.stringify({ ...creds(), fresher: true }));
    r = loader.applySessionId(d, id);
    check('same ID again = unchanged, fresher creds kept', r.status === 'unchanged' && JSON.parse(fs.readFileSync(path.join(d, 'creds.json'))).fresher === true);
    r = loader.applySessionId(d, mk(creds(2)));
    check('NEW ID replaces the credentials', r.status === 'loaded' && JSON.parse(fs.readFileSync(path.join(d, 'creds.json'))).registrationId === 2);
    check('empty = missing', loader.applySessionId(d, '').status === 'missing');
    check('garbage = invalid with a message', (r = loader.applySessionId(d, 'nope')).status === 'invalid' && !!r.message);

    d = dir();
    loader.applySessionId(d, id);
    loader.markDead(d, id);
    check('markDead clears the credentials', !fs.existsSync(path.join(d, 'creds.json')));
    r = loader.applySessionId(d, id);
    check('a dead ID is refused (no restart loop)', r.status === 'dead');
    check('a different ID still works after a dead one', loader.applySessionId(d, mk(creds(3))).status === 'loaded');

    d = dir();
    loader.applySessionId(d, id);
    loader.forgetLoaded(d);
    check('forgetLoaded makes the next start re-apply the ID', loader.applySessionId(d, id).status === 'loaded');

    console.log('[promptForSessionId]');
    let t = io();
    let p = promptForSessionId(t);
    t.input.write(id + '\n');
    r = await p;
    check('single-line paste accepted', r.ok && r.sessionId === id);
    check('prompt tells the operator the TELMAS~ prefix', /TELMAS~/.test(t.text()));

    t = io(); p = promptForSessionId(t);
    const third = Math.floor(id.length / 3);
    t.input.write(id.slice(0, third) + '\n'); await tick();
    t.input.write(id.slice(third, 2 * third) + '\n'); await tick();
    const mid = t.text();
    t.input.write(id.slice(2 * third) + '\n');
    r = await p;
    check('paste cut into 3 lines is stitched together', r.ok && r.sessionId === id);
    check('operator is told the rest is awaited', /not complete yet/.test(mid));

    t = io(); p = promptForSessionId(t);
    t.input.write('hello world\n'); await tick();
    t.input.write(id + '\n');
    r = await p;
    check('wrong value rejected with a reason, then the right one accepted', r.ok && /must start with/.test(t.text()));

    t = io(); p = promptForSessionId(t);
    t.input.write(id.slice(0, 30) + '\n'); await tick();
    t.input.write('reset\n'); await tick();
    t.input.write(id + '\n');
    r = await p;
    check("'reset' starts over", r.ok && r.sessionId === id);

    t = io(); p = promptForSessionId(t);
    t.input.end();
    r = await p;
    check('closed console gives up cleanly (eof)', !r.ok && r.reason === 'eof');

    console.log('[acquireSession]');
    d = dir();
    let env = { SESSION_ID: id };
    r = await acquireSession(d, env, { allowPrompt: false });
    check('SESSION_ID env is used first', r.status === 'loaded');

    d = dir(); env = {};
    r = await acquireSession(d, env, { allowPrompt: false, hasSavedCreds: true });
    check('no ID but saved creds on disk = saved', r.status === 'saved');

    d = dir(); env = {};
    r = await acquireSession(d, env, { allowPrompt: false });
    check('no ID, no prompt = missing', r.status === 'missing');

    d = dir(); env = {}; t = io();
    const ap = acquireSession(d, env, { input: t.input, output: t.output, pollMs: 50, root: dir() });
    t.input.write(id + '\n');
    r = await ap;
    check('console paste loads the session and sets env.SESSION_ID', r.status === 'loaded' && r.via === 'console' && env.SESSION_ID === id);

    d = dir(); env = {}; t = io();
    const root = dir();
    const ap2 = acquireSession(d, env, { input: t.input, output: t.output, pollMs: 50, root });
    await tick();
    fs.writeFileSync(path.join(root, 'session.txt'), id);
    r = await ap2;
    check('session.txt drop-in loads the session', r.status === 'loaded' && r.via === 'file');
    check('session.txt is deleted after reading', !fs.existsSync(path.join(root, 'session.txt')));

    d = dir(); env = {}; t = io();
    const ap3 = acquireSession(d, env, { input: t.input, output: t.output, pollMs: 50, root: dir() });
    await tick();
    t.input.end();
    await tick();
    check('host without console input says to use session.txt', /session\.txt/.test(t.text()) && /does not pass console input/.test(t.text()));
    void ap3; // left waiting on purpose; process.exit below ends it

    console.log(`\n${pass} passed, ${fail} failed`);
    process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
