//watcher.js
//Watcher object to keep track of directory state
(function () {
  if (typeof exports === 'undefined') {
    throw new Error('watcher.js must be loaded as a module.');
  }

  var fs = require('fs');
  var path = require('path');
  var winston = require('winston');
  var w = exports;

  w.makeWatcher = function (){
    return {
      watched: [],
      checkFile: function (fPath, fn) {
        var dir = path.dirname(fPath);
        var base = path.basename(fPath);
        var watched = this.watched;

        if (typeof watched[dir] === 'undefined'
          || typeof watched[dir].files === 'undefined'
          || typeof watched[dir].files[base] === 'undefined')
        {
          return fn && fn(false);
        }
        else {
          fs.stat(fPath, function onStat(err, stats) {
            if (err) { return fn && fn(err); }

            return fn && fn(null, watched[dir].files[base] === stats.mtime.valueOf());
          });
        }
      },
      addFile: function (fPath, fn) {
        var dir = path.dirname(fPath);
        var base = path.basename(fPath);
        var watched = this.watched;

        if (typeof watched[dir] === 'undefined') { watched[dir] = {}; }
        if (typeof watched[dir].files === 'undefined') { watched[dir].files = []; }

        fs.stat(fPath, function onStat(err, stats) {
          if (err) { return fn && fn(err); }
          watched[dir].files[base] = stats.mtime.valueOf();

          return fn && fn();
        });
      },
      syncFolder: function(folderPath) {
        //Ugly, but we can't tell if something is gone, so loop through and delete any
        //missing files from our watched object
        
        var watched = this.watched;
        if (typeof watched[folderPath] === 'undefined') {
          return; //nothing to do
        }

        watched[folderPath].files.forEach(function (tFile) {
          var fPath = path.join(folderPath, tFile);
          fs.stat(fPath, function(err, stats) {
            if (err) {
              winston.info('removing ' + folderPath + ' - ' + tFile);
              delete(watched[folderPath].files[tFile]);
            }
          });
        });
      }
    };
  };
}());
