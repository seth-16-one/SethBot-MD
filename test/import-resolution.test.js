/**
 * Verifies that the internal relative imports introduced/changed by the
 * multi-customer refactor resolve to real files on disk.
 *
 * This focuses on the customer-aware modules (lib/paths.js, lib/owner.js,
 * lib/dataDir.js) that the modified files now depend on. It does NOT load the
 * modified files themselves (many require external deps such as baileys /
 * fluent-ffmpeg that may not be installed here), it only resolves their
 * internal module specifiers via require.resolve(), which catches typos and
 * wrong relative paths in the new imports.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const modifiedFiles = [
    'index.js','main.js',
    'lib/paths.js','lib/owner.js','lib/dataDir.js','lib/lightweight_store.js','lib/isOwner.js',
    'lib/index.js','lib/antibadword.js','lib/reactions.js','lib/antilinkHelper.js','lib/converter.js',
    'lib/ytdl2.js','lib/uploadImage.js','lib/tempCleanup.js','lib/sticker.js',
    'commands/antidelete.js','commands/clearsession.js','commands/cleartmp.js','commands/autoread.js',
    'commands/autostatus.js','commands/autotyping.js','commands/ban.js','commands/chatbot.js',
    'commands/mention.js','commands/unban.js','commands/warnings.js','commands/topmembers.js',
    'commands/settings.js','commands/warn.js','commands/anime.js','commands/emojimix.js',
    'commands/facebook.js','commands/groupmanage.js','commands/igs.js','commands/hidetag.js',
    'commands/tag.js','commands/setpp.js','commands/stickertelegram.js','commands/stickercrop.js',
    'commands/sticker.js','commands/sticker-alt.js','commands/song.js','commands/simage.js',
    'commands/url.js','commands/update.js',
];

// Internal modules the refactor depends on. We make sure every modified file
// that references them resolves correctly.
const internalSpecs = ['../lib/paths','./paths','../lib/owner','./owner','../lib/dataDir'];

let failures = 0;
let checked = 0;

for (const rel of modifiedFiles) {
    const file = path.join(ROOT, rel);
    if (!fs.existsSync(file)) {
        console.error(`❌ missing file: ${rel}`);
        failures++;
        continue;
    }
    const src = fs.readFileSync(file, 'utf-8');
    for (const spec of internalSpecs) {
        // look for require('spec') or require("spec") exactly
        const re = new RegExp(`require\\(\\s*['"]${spec.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]\\s*\\)`);
        if (!re.test(src)) continue;
        checked++;
        try {
            const resolved = require.resolve(spec, { paths: [path.dirname(file)] });
            if (!fs.existsSync(resolved)) throw new Error(`resolved to non-existent ${resolved}`);
            console.log(`  ✅ ${rel} -> require('${spec}') resolves`);
        } catch (e) {
            console.error(`  ❌ ${rel} -> require('${spec}') FAILED: ${e.message}`);
            failures++;
        }
    }
}

console.log(`\nChecked ${checked} internal import(s) across ${modifiedFiles.length} files.`);
console.log(`=== RESULT: ${failures === 0 ? 'ALL INTERNAL IMPORTS RESOLVE ✅' : failures + ' FAILURE(S) ❌'} ===`);
process.exit(failures === 0 ? 0 : 1);
