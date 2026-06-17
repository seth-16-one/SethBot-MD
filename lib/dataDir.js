const path = require('path');

module.exports =
  process.env.DATA_DIR
    ? path.resolve(process.env.DATA_DIR)
    : path.resolve('./data');
