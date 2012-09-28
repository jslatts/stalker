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
  
  //Sucky work around for lame fs.watch() api
  var handles = {};

  var options = {};

  var st = exports;

  var folderChanged = function(folderPath, fnAdd, fnRemove) {
    return function (event, filename) {
      var reset = true;
      if (event === 'change') {
        reset = false;
      }

      //Because of the goofy fs.watch() api, we have to close and recreate the 
      //file watch handle. Except sometimes the file was moved and this blows up
      //So close, then check and recreate if it still exists
      if (reset) {
        handles[folderPath].close();
      }

      fs.stat(folderPath, function(err) {
        if (err) { return; }

        if (reset) {
          handles[folderPath] = fs.watch(folderPath, folderChanged(folderPath, fnAdd, fnRemove));
        }

        fs.readdir(folderPath, function _readdir(err, files) {
          if (err) { console.log('read');return fnAdd && fnAdd(err); }

          files.forEach(function _forEach(file){
            if (file[0] === '.') { return; } //ignore files starting with "."

            var fPath = path.join(folderPath, file);
            fs.stat(fPath, function _stat(err, stats) {
              if (err) { return fnAdd && fnAdd(err); }

              //If we have a file, send it to our callback
              if (stats.isFile()) {

                watcher.checkFile(fPath, options.strict, function _checkFile(err, result) {
                  if (err) { return fnAdd && fnAdd(err); }
                  if (!result) {
                    watcher.addFile(fPath, function onAddFile() {
                      return fnAdd && fnAdd(null, fPath);
                    });
                  }
                });
              }
              else if (stats.isDirectory() && options.recurse) {
                watchFolderTree(fPath, fnAdd, fnRemove, Infinity);     //if we have a dir, match sure it is watched
              }
            });
          });
        });

        watcher.syncFolder(folderPath, fnRemove);
      });
    };
  };

  //Takes a folder root and a callback and recurses through to a directory tree
  //Calls fn(null, directory) whenever a file is added to one of the watched
  //directories
  var watchFolderTree = function (fPath, fnAdd, fnRemove, depth) {
    fs.stat(fPath, function onStat(err, stats) {
      if (err) { return fnAdd && fnAdd(err); }

      if (stats.isDirectory() && depth > 0) {
        //If we have a directory, watch it and recurse down
        watcher.checkFile(fPath, options.strict, function _checkFile(err, result) {
          if (err) { return fnAdd && fnAdd(err); }

          if (!result) {
            watcher.addFile(fPath, function _addFile() {
              //Clear out any old listeners. Is there a better way?
              if (typeof(handles[fPath]) === 'object') { handles[fPath].close(); }

              handles[fPath] = fs.watch(fPath, folderChanged(fPath, fnAdd, fnRemove));
            });
          }
        });

        //Recurse over anything in this directory
        fs.readdir(fPath, function _readdir(err, files) {
          if (err) { return fnAdd && fnAdd(err); }

          files.forEach(function (file) {
            if (file[0] === '.') { return; } //ignore files starting with "."

            var rPath = path.join(fPath, file);
//            console.log('depth later ' + depth)
            watchFolderTree(rPath, fnAdd, fnRemove, depth - 1 );
          });
        });
      }
      else if (stats.isFile()) {
        watcher.checkFile(fPath, options.strict, function _checkFile(err, result) {
          if (err) { return fnAdd && fnAdd(err); }
          if (!result) {
            watcher.addFile(fPath, function _addFile() {
              //If startSilent has been requested, do not fire the callbacks on first read of the directory 
              if (!options.startSilent) {
                return fnAdd && fnAdd(null, fPath);
              }
            });
          }
        });
      }
    });
  };

  st.stop =  function(reqPath, fn) {
    if (typeof reqPath === 'function') {
      fn = reqPath
      reqPath = null
    }

    var nPath = path.resolve(reqPath)

    fs.exists(nPath, function _exists(exists) {
      if (!exists) {
        nPath = nPath || ''
        return fn && fn('Path does not exist: ' + nPath)
      }
    })

    fs.unwatchFile(nPath);
    watcher.kill(nPath, fn);
  }

  st.watch =  function(reqPath, opts, fnAdd, fnRemove) {
    if (typeof opts === 'function') {
      //do not require options
      fnRemove = fnAdd;
      fnAdd = opts;
      opts = {};
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

    options = opts;
    options.recurse = typeof options.recurse === 'undefined' ? true : options.recurse;
    options.strict = typeof options.strict === 'undefined' ? false : options.strict;
    options.startSilent = typeof options.startSilent === 'undefined' ? false : options.startSilent;

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

    fs.exists(nPath, function _exists(exists) {
      if (!exists) {
        nPath = nPath || '';
        return fnAdd && fnAdd('Path does not exist: ' + nPath);
      }

      var depth = options.recurse ? Infinity : 1;
      watchFolderTree(nPath, fnAdd, fnRemove, depth);
    });
  };
}());

