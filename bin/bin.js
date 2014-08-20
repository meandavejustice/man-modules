#!/usr/bin/env node
var manModules = require('../index');
var minimist = require('minimist');
var fs = require('fs');

var argv = minimist(process.argv.slice(2), {
    alias: { h: 'help' }
});

if (argv.help) {
  fs.createReadStream(__dirname + '/usage.txt').pipe(process.stdout);
  return;
} else {
  manModules();
}