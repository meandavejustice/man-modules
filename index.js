require('./node_modules/marked-man/lib/marked-man');
var through = require('through')
  , rimraf = require('rimraf')
  , pygmentize = require('pygmentize-bundled')
  , colors = require('colors')
  , mkdirp = require('mkdirp')
  , fs = require('fs')
  , path = require('path')
  , ls = require('ls-stream')
  , mm = require('marked-man/node_modules/marked/index.js');

var shCmd = 'echo "MANPATH=$MANPATH:' + process.cwd() + '/node_modules/.man; export MANPATH" >> ~/.bashrc'
  , readmes = ['readme.markdown', 'readme.md', 'readme.mkd']
  , basemanpath = 'node_modules/.man/'
  , readmes2convert = []
  , fileswritten = 0
  , seenFiles = {};

var pygmentizeOpts = {
  lang: 'bash',
  format: 'terminal256',
  options: {
    startinline: 1
  }
};

function isReadme(filepath) {
  return !!~readmes.indexOf(path.basename(filepath).toLowerCase())
}

function printMsg() {
  pygmentize(pygmentizeOpts, shCmd, function (err, result) {
    console.log('\n \n',
                'You can run this ' + 'command:'.underline.magenta + '\n \n',
                result.toString(),
                '\n to access new files with ' + 'man'.underline.magenta + '.',
                ' (make sure to open a new '+'shell'.magenta+' first)',
                '\n \n');
  });
}

function writeFile(fileObj) {
  fs.readFile(fileObj.path, function(err, data) {
    if (err) console.log('error reading ', fileObj.path + ' :', err);

      fs.writeFile(fileObj.finalpath, mm(data.toString()), function(err) {
        if (err) console.log('error writing ', fileObj.finalpath + ' :', err);

        fileswritten++;

        if (fileswritten === readmes2convert.length) {
          readmes2convert.forEach(function(obj) {
            console.log('wrote ', obj.finalpath.underline.green);
          });
          printMsg();
        }
      });
  });
}

function readme2man () {
  ls('node_modules')
  .pipe(through(function(entry) {
          if (isReadme(entry.path)) {
            var idx = 1;
            var moduleName = entry.path.split(path.sep)[1];

            if (seenFiles[moduleName]) {
              idx = ++seenFiles[moduleName];
            } else {
              seenFiles[moduleName] = 1;
            }

            readmes2convert.push({
              path: entry.path,
              localbasepath: basemanpath + '/man'+idx,
              finalpath: basemanpath + '/man'+idx+'/' + moduleName + '.' + idx,
              name: moduleName
            });
          }
        })).on('end', function() {
    readmes2convert.forEach(function(readmeObj) {
      fs.exists(readmeObj.finalpath, function(exists) {
        if (exists) {
          writeFile(readmeObj);
        } else {
          mkdirp(readmeObj.localbasepath, function(err) {
            if (err) console.error(err);
            writeFile(readmeObj);
          })
        }
      });
    });
  });
}

module.exports = function() {
  rimraf('./node_modules/.man', function(err) {
    if (err) console.error(err);

    console.log('\n cleaned .man Directory'.red, '\n');

    mkdirp(basemanpath, function (err) {
      if (err) console.error(err);
      readme2man();
    });
  });
};