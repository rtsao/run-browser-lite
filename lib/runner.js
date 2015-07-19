'use strict';
var process = require('process');
var runbrowser = require('../index.js');

module.exports = function runner(opts) {
  var timeout = opts.timeout || Infinity;
  var report = opts.report;
  var phantom = opts.phantom;
  var port = opts.port || 3000;
  var filename = opts.filename;
  var filesystem = opts.filesystem || require('fs');

  var server = runbrowser(filename, report, phantom, filesystem);
  server.listen(port);

  if (!phantom) {
    console.log('Open a browser and navigate to "http://localhost:' + port + '"');
  } else {
    var proc = runbrowser.runPhantom('http://localhost:' + port + '/');

    proc.stdout.pipe(process.stdout);
    proc.stderr.pipe(process.stderr);

    if (timeout < Infinity) {
      setTimeout(function() {
        console.log(fmt('Timeout of %dms exceeded', timeout));
        proc.kill();
        server.close();
      }, timeout);
    }
  }
}
