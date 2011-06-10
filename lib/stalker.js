//stalker.js
//Watches a directory for file changes and fires the callbacks when found
(function () {
  if (typeof exports === 'undefined') {
    throw new Error('stalker.js must be loaded as a module.');
  }

  var fs   = require('fs');
  var path = require('path');

  //Helpful object friend
  var watcher = require('./watcher').makeWatcher();

  var st = exports;

  var folderChanged = function(folderPath, fn) {
    return function (curr, prev) {
      if (curr.mtime.valueOf() === prev.mtime.valueOf()) { return; } //Don't act on a read
      fs.readdir(folderPath, function _readdir(err, files) {
        if (err) { return fn && fn(err); }

        files.forEach(function _forEach(file){
          if (/^\./.test(file)) { return; } //ignore files starting with "."

          var fPath = path.join(folderPath, file);
          fs.stat(fPath, function _stat(err, stats) {
            if (err) { return fn && fn(err); }

            //If we have a file, send it to our callback
            if (stats.isFile()) {

              watcher.checkFile(fPath, function _checkFile(err, result) {
                if (err) { return fn && fn(err); }
                if (!result) {
                  watcher.addFile(fPath, function onAddFile() {
                    return fn && fn(null, fPath);
                  });
                }
              });
            }
            else if (stats.isDirectory()) {
              watchFolderTree(fPath, fn);     //if we have a dir, match sure it is watched
            }
          });
        });
      });

      watcher.syncFolder(folderPath);
    };
  };

  //Takes a folder root and a callback and recurses through to a directory tree
  //Calls fn(null, directory) whenever a file is added to one of the watched
  //directories
  var watchFolderTree = function (fPath, fn) {
    fs.stat(fPath, function onStat(err, stats) {
      if (err) { return fn && fn(err); }

      if (stats.isDirectory()) {
        //If we have a directory, watch it and recurse down
        watcher.checkFile(fPath, function _checkFile(err, result) {
          if (err) { return fn && fn(err); }

          if (!result) {
            //watcher.reset(fPath);
            watcher.addFile(fPath, function _addFile() {
              fs.unwatchFile(fPath);  //Clear out any old listeners. Is there a better way?
              fs.watchFile(fPath, folderChanged(fPath, fn));
            });
          }
        });

        //Recurse over anything in this directory
        fs.readdir(fPath, function _readdir(err, files) {
          if (err) { return fn && fn(err); }

          files.forEach(function (file) {
            if (/^\./.test(file)) { return; } //ignore files starting with "."

            var rPath = path.join(fPath, file);
            watchFolderTree(rPath, fn);
          });
        });
      }
      else if (stats.isFile()) {
        watcher.checkFile(fPath, function _checkFile(err, result) {
          if (err) { return fn && fn(err); }
          if (!result) {
            watcher.addFile(fPath, function onAddFile() {
              return fn && fn(null, fPath);
            });
          }
        });
      }
    });
  };

  st.watch =  function(reqPath, options, fn) {
    if (typeof options === 'function') {
      //do not require options
      fn = options;
      options = {};
    }

    var original_fn = fn;
    if (typeof fn !== 'function') {
      throw {
        name    : 'TypeError',
        message : 'fn must be a function'
      };
    }

    var nPath = path.resolve(reqPath);

    //If a buffer time is passed, then wrap the passed in callback
    if (typeof options.buffer === 'number') {
      fn = (function maker() {
        var fileBuffer = [];
        var flushTimer;

        //Setup the buffer timer to flush contents
        function flushBuffer() {
          if (fileBuffer.length > 0 && original_fn) {
            var tempBuffer = fileBuffer;
            fileBuffer = [];

            original_fn(null, tempBuffer);
          }

          flushTimer = null;
        };

        return function new_fn(err, file) {
          if (!err) {
            if (!flushTimer) {
              flushTimer = setTimeout(flushBuffer, options.buffer);
            }

            fileBuffer.push(file);
          }
        };
      }());
    }

    path.exists(nPath, function _exists(exists) {
      if (!exists) {
        nPath = nPath || '';
        return fn && fn('Path does not exist: ' + nPath);
      }

      watchFolderTree(nPath, fn);
    });
  };
}());

