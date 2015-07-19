#!/usr/bin/env node

'use strict';
var process = require('process');
var console = require('console');
var parseArgs = require('minimist');
var fmt = require('util').format;

var runbrowser = require('../index.js');
var runner = require('../lib/runner.js');

var args = parseArgs(process.argv.slice(2));

var filename = args._[0];
var port = Number(args.p || args.port);
var help = args.help || args.h || args._.length === 0;
var phantom = args.b || args.phantom || args.phantomjs;
var report = args.p || args.report || args.istanbul;
var debug = args.d || args.debug;
var timeout = args.t || args.timeout;

if (help) {
  var helpText = [
    '',
    'Usage:',
    '  run-browser <file> <options>',
    '',
    'Options:',
    '  -p --port <number> The port number to run the server on (default: 3000)',
    '  -b --phantom       Use the phantom headless browser to run tests and then exit with the correct status code (if tests output TAP)',
    '  -r --report        Generate coverage Istanbul report. Repeat for each type of coverage report desired. (default: text only)',
    '  -t --timeout       Global timeout in milliseconds for tests to finish. (default: Infinity)',
    '',
    'Example:',
    '  run-browser test-file.js --port 3030 --report text --report html --report=cobertura',
    ''
  ].join('\n');
  console.log(helpText);
  process.exit(process.argv.length === 3 ? 0 : 1);
}

runner({
  filename: filename,
  phantom: phantom,
  port: port,
  report: report,
  timeout: timeout
});
