'use strict';

var http = require('http');
var fs = require('fs');
var inspect = require('util').inspect;
var path = require('path');
var webpack = require('webpack');
var glob = require('glob');
var JSONStream = require('jsonstream2');
var istanbul = require('babel-istanbul');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var runPhantom = require('./lib/run-phantom.js')
var html = fs.readFileSync(__dirname + '/lib/test-page.html', 'utf8');

module.exports = createServer;
module.exports.runPhantom = runPhantom;
module.exports.createHandler = createHandler;
module.exports.handles = handles;

function createServer(filename, reports, phantom) {
  var handler = createHandler(filename, reports, phantom);
  return http.createServer(handler);
}

function handleError(err, res) {
  var e = JSON.stringify(err.toString());
  res.end('document.getElementById("__testling_output").textContent = ' + 
    e + ';console.error(' + e + ');');
  if (err) console.error(err.stack || err.message || err);
}

function createHandler(filename, reports, phantom) {

  if (typeof reports === 'boolean' && reports) reports = [ 'text' ];
  else if (typeof reports === 'string') reports = [ reports ];

  if (reports && !Array.isArray(reports)) return new Error('Invalid reports type' + reports);

  return function (req, res) {
    if (req.url === '/') {
      res.setHeader('Content-Type', 'text/html');
      return res.end(html);
    }
    if ('/tests-bundle.js' === req.url) {
      var sent = false;
      res.setHeader('Content-Type', 'application/javascript');
      return glob(filename, function (err, files) {
        if (err || files.length === 0) {
          err = err || new Error('No files found matching ' + inspect(filename));
          return handleError(err, res);
        }

        fs.readFile(filename, 'utf8', onBundleSrc);

        function onBundleSrc(err, src) {
          if (sent) return;
          sent = true;
          return err ? handleError(err, res) : res.end(src);
        }

        function normalizePath(p) {
          return path.resolve(p);
        }
      });
    }
    if ('/results' === req.url && req.method === 'POST') {
      return req.pipe(JSONStream.parse('*')).once('data', function (results) {

        if (results.coverage) {
          var collector = new istanbul.Collector();
          var reporter = new istanbul.Reporter();
          var sync = false;
          collector.add(results.coverage);
          reporter.addAll(reports);
          reporter.write(collector, sync, done);
        }
        else {
          done();
        }

        function done(err) {
          res.statusCode === 200;
          res.end('OK');
          var passed = results.tap.fail.length === 0;
          if (phantom) process.exit(passed ? 0 : 1);
        }
      })
    }
    res.statusCode = 404;
    res.end('404: Path not found');
  }
}

function handles(req) {
  return req.url === '/' || req.url === '/tests-bundle.js';
}
