/**
 * Backward-compatibility shim.
 *
 * Historical code resolved the data directory inline with
 * `process.env.DATA_DIR || './data'`. That logic now lives in lib/paths.js so
 * every path is resolved in one place. This module keeps the old import path
 * working by re-exporting the resolved DATA_DIR.
 */
const { DATA_DIR } = require('./paths');

module.exports = DATA_DIR;
