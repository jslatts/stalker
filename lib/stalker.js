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

  var folderChanged = function(folderPath, fnAdd, fnRemove) {
    return function (curr, prev) {
      if (curr.mtime.valueOf() === prev.mtime.valueOf()) { return; } //Don't act on a read
      fs.readdir(folderPath, function _readdir(err, files) {
        if (err) { return fnAdd && fnAdd(err); }

        files.forEach(function _forEach(file){
          if (file[0] === '.') { return; } //ignore files starting with "."

          var fPath = path.join(folderPath, file);
          fs.stat(fPath, function _stat(err, stats) {
            if (err) { return fnAdd && fnAdd(err); }

            //If we have a file, send it to our callback
            if (stats.isFile()) {

              watcher.checkFile(fPath, function _checkFile(err, result) {
                if (err) { return fnAdd && fnAdd(err); }
                if (!result) {
                  watcher.addFile(fPath, function onAddFile() {
                    return fnAdd && fnAdd(null, fPath);
                  });
                }
              });
            }
            else if (stats.isDirectory()) {
              watchFolderTree(fPath, fnAdd, fnRemove);     //if we have a dir, match sure it is watched
            }
          });
        });
      });

      watcher.syncFolder(folderPath, fnRemove);
    };
  };

  //Takes a folder root and a callback and recurses through to a directory tree
  //Calls fn(null, directory) whenever a file is added to one of the watched
  //directories
  var watchFolderTree = function (fPath, fnAdd, fnRemove) {
    fs.stat(fPath, function onStat(err, stats) {
      if (err) { return fnAdd && fnAdd(err); }

      if (stats.isDirectory()) {
        //If we have a directory, watch it and recurse down
        watcher.checkFile(fPath, function _checkFile(err, result) {
          if (err) { return fnAdd && fnAdd(err); }

          if (!result) {
            //watcher.reset(fPath);
            watcher.addFile(fPath, function _addFile() {
              fs.unwatchFile(fPath);  //Clear out any old listeners. Is there a better way?
              fs.watchFile(fPath, folderChanged(fPath, fnAdd, fnRemove));
            });
          }
        });

        //Recurse over anything in this directory
        fs.readdir(fPath, function _readdir(err, files) {
          if (err) { return fnAdd && fnAdd(err); }

          files.forEach(function (file) {
            if (file[0] === '.') { return; } //ignore files starting with "."

            var rPath = path.join(fPath, file);
            watchFolderTree(rPath, fnAdd, fnRemove);
          });
        });
      }
      else if (stats.isFile()) {
        watcher.checkFile(fPath, function _checkFile(err, result) {
          if (err) { return fnAdd && fnAdd(err); }
          if (!result) {
            watcher.addFile(fPath, function _addFile() {
              return fnAdd && fnAdd(null, fPath);
            });
          }
        });
      }
    });
  };

  st.watch =  function(reqPath, options, fnAdd, fnRemove) {
    if (typeof options === 'function') {
      //do not require options
      fnRemove = fnAdd;
      fnAdd = options;
      options = {};
    }

    var original_fnAdd = fnAdd;
    var original_fnRemove = fnRemove;
    if (typeof fnAdd !== 'function') {
      throw {
        name    : 'TypeError',
        message : 'Must provide a callback function'
      };
    }

    var nPath = path.resolve(reqPath);

    //If a buffer time is passed, then wrap the passed in callback
    if (typeof options.buffer === 'number') {
      fnAdd = (function maker() {
        var fileBuffer = [];
        var flushTimer;

        //Setup the buffer timer to flush contents
        function flushBuffer() {
          if (fileBuffer.length > 0 && original_fnAdd) {
            var tempBuffer = fileBuffer;
            fileBuffer = [];

            original_fnAdd(null, tempBuffer);
          }

          flushTimer = null;
        }

        return function new_fnAdd(err, file) {
          if (err) { return original_fnAdd(err); }

          if (!flushTimer) {
            flushTimer = setTimeout(flushBuffer, options.buffer);
          }

          fileBuffer.push(file);
        };
      }());
      if (typeof fnRemove === 'function') {
        fnRemove = (function maker() {
          var fileBuffer = [];
          var flushTimer;

          //Setup the buffer timer to flush contents
          function flushBuffer() {
            if (fileBuffer.length > 0 && original_fnRemove) {
              var tempBuffer = fileBuffer;
              fileBuffer = [];

              original_fnRemove(null, tempBuffer);
            }

            flushTimer = null;
          }

          return function new_fnRemove(err, file) {
            if (err) { return original_fnRemove(err); }

            if (!flushTimer) {
              flushTimer = setTimeout(flushBuffer, options.buffer);
            }

            fileBuffer.push(file);
          };
        }());
      }
    }

    path.exists(nPath, function _exists(exists) {
      if (!exists) {
        nPath = nPath || '';
        return fnAdd && fnAdd('Path does not exist: ' + nPath);
      }

      watchFolderTree(nPath, fnAdd, fnRemove);
    });
  };
}());

