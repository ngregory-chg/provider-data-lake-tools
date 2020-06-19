/* eslint-disable no-console */
// Winston transport that colorizes console output according to level.
const TransportStream = require('winston-transport');
const { LEVEL, MESSAGE } = require('triple-beam');

const ESC = '\x1b[';
const LEVEL_COLORS = {
  error: [ 31 ],
  warn: [ 1, 33 ],
  info: [ 1, 34 ],
  verbose: [ 32 ],
  debug: [ 37 ],
  silly: [ 1, 30 ]
};
const RESET = 0;

// Adds ANSI codes to the given text to apply the color for the given level.
const colorize = (level, txt) => {
  return LEVEL_COLORS[level].map(code => ESC + code + 'm').join('') + txt + ESC + RESET + 'm';
};

module.exports = class AnsiConsoleTransport extends TransportStream {
  constructor(options = {}) {
    super(options);
  }

  log(info, callback) {
    const level = info.level;
    let msg = `[${level.toUpperCase()}] ${info.message}`;
    const meta = { ...info };
    delete meta.level;
    delete meta.message;
    delete meta[LEVEL];
    delete meta[MESSAGE];
    const sendToErr = level === 'error' || level === 'warn';
    console[sendToErr ? 'error' : 'log'](colorize(level, msg));

    if (meta && Object.keys(meta).length) {
      console.dir(meta);
    }

    if (callback && typeof callback === 'function') {
      callback(null, true);
    }
  }
};
