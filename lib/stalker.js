//stalker.js
//Watches a directory for file changes and fires the callbacks when found
//TODO: make it smarter about deletions. It's probably totally borked
(function () {
  if (typeof exports === 'undefined') {
    throw new Error('stalker.js must be loaded as a module.');
  }

  var fs = require('fs');
  var path = require('path');
  var winston = require('winston');

  //Helpful object friend
  var watcher = require('./watcher').makeWatcher();

  var st = exports;

  var folderChanged = function(folderPath, fn) {
    return function (curr, prev) {
      if (curr.mtime.valueOf() === prev.mtime.valueOf()) { return; } //Don't act on a read
      winston.info('[folderChanged] fired for ' + folderPath);
      fs.readdir(folderPath, function onReaddirInner(err, files) {
        if (err) { return fn && fn(err); }

        files.forEach(function (file){
          if (/^\./.test(file)) { return; } //ignore files starting with "."

          var fPath = path.join(folderPath, file);
          fs.stat(fPath, function onStatInner(err, stats) {
            if (err) { return fn && fn(err); }

            //If we have a file, send it to our callback
            if (stats.isFile()) {

              watcher.checkFile(fPath, function onCheckFile(err, result) {
                if (err) { return winston.info('[checkFile] error: ' + err); }
                if (!result) {
                  watcher.addFile(fPath, function onAddFile() {
                    return fn && fn(null, fPath);
                  });
                }
              });
            }
            else if (stats.isDirectory()) {
              var watchFolderTree = watchFolderTree || function() {};
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
    if (typeof fn !== 'function') {
      throw {
        name: 'TypeError', 
        message: 'fn must be a function'
      };
    }

    fs.stat(fPath, function onStat(err, stats) {
      if (err) { return fn && fn(err); }

      if (stats.isDirectory()) {
        //If we have a directory, watch it and recurse down
        watcher.checkFile(fPath, function onCheckFile(err, result) {
          if (err) { return winston.info('[checkFile] error: ' + err); }

          if (!result) {
            watcher.addFile(fPath, function onAddFile() {
              winston.info('[watchFolderTree][onStat] watching ' + fPath + '\n');
              fs.watchFile(fPath, folderChanged(fPath, fn));
            });
          }
        });

        //Recurse over anything in this directory
        fs.readdir(fPath, function onReaddir(err, files) {
          if (err) { return fn && fn(err); }

          files.forEach(function (file) {
            if (/^\./.test(file)) { return; } //ignore files starting with "."

            var rPath = path.join(fPath, file);
            watchFolderTree(rPath, fn);
          });
        });
      }
      else if (stats.isFile()) {
        winston.info('stats called for ' + fPath);

        watcher.checkFile(fPath, function onCheckFile(err, result) {
          if (err) { return winston.info('[checkFile] error: ' + err); }
          if (!result) {
            watcher.addFile(fPath, function onAddFile() {
              return fn && fn(null, fPath);
            });
          }
        });
      }
    });
  };

  st.watch =  function(reqPath, fn) {
    var nPath = path.resolve(reqPath);

    path.exists(nPath, function onExistsReturn(exists) {
      if (!exists) {
        nPath = nPath || '';
        return fn && fn('Path does not exist: ' + nPath);
      }

      watchFolderTree(nPath, fn);
    });
  };
}());
