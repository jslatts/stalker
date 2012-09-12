//watcher.js
//Watcher object to keep track of directory state
(function () {
  if (typeof exports === 'undefined') {
    throw new Error('watcher.js must be loaded as a module.');
  }

  var fs = require('fs');
  var path = require('path');

  module.exports.makeWatcher = function makeWatcher() {
    var watched = [];

    var removeSubDir = function (dir, fn){
      //console.log('called removeSubDir with ' + dir)
      //console.dir(watched)
      if (!watched[dir]) return;
      
      if (watched[dir].files) {
        Object.keys(watched[dir].files).forEach(function _forEach(iFile) {
          //If we have a key for this, then its a dir. Recurse
          //Otherwise, we have a file, so fire the removal callback
          var fPath = dir + '/' + iFile;
          if (watched[fPath]) {

            removeSubDir(fPath, fn);
          }
          else {
            return fn && fn(null, fPath); // Fire the removal callback
          }
        });
      }

      delete(watched[dir]);     // Delete the directory once the children are removed 
    };

    return {
      //Returns false if a file is not being tracked. Will ignore mtime unless 
      //strict is truthy. 
      checkFile: function (fPath, strict, fn) {
        if (typeof(strict) === 'function') {
          fn = strict;
          strict = false;
        }

        var dir  = path.dirname(fPath);
        var base = path.basename(fPath);

        if (typeof watched === 'undefined')
        {
          return fn && fn('[checkFile] watched array not properly defined.');
        }
        else {
          fs.stat(fPath, function onStat(err, stats) {
            //If we get back an error, then the directory doesn't exist. So we aren't watching it, duh!
            if (err) { return fn && fn(null, false); }

            //If the watched [] has not been initialized, we know the file isn't tracked
            if (typeof watched[dir] === 'undefined' || typeof watched[dir].files === 'undefined') {
              return fn && fn(null, false);
            }

            if (strict) {
              return fn && fn(null, watched[dir].files[base] === stats.mtime.valueOf());
            }
            else {
              return fn && fn(null, typeof watched[dir].files[base] !== 'undefined'); 
            }

          });
        }
                 },
        addFile: function (fPath, fn) {
                   var dir  = path.dirname(fPath);
                   var base = path.basename(fPath);

                   if (typeof watched[dir] === 'undefined') { watched[dir] = {}; }
                   if (typeof watched[dir].files === 'undefined') { watched[dir].files = {}; }

                   fs.stat(fPath, function onStat(err, stats) {
                     if (err) { return fn && fn(err); }
                     watched[dir].files[base] = stats.mtime.valueOf();

                     return fn && fn(null);
                   });
                 },
        reset: function (fPath, fn) {
                 delete(watched[fPath]);
                 return fn && fn(null);
               },
        kill: function (fPath, fn) {
                //no string, KILL EVERYTHING, RAWR!
                if (typeof fPath !== 'string') {
                  Object.keys(watched).forEach(function (f) {
                    removeSubDir(f, null);
                  })

                  return fn && fn(null)
                }
                else {
                  removeSubDir(fPath, fn);
                }
               },
        syncFolder: function(dir, fnRemove) {
          //Ugly, but we can't tell if something is gone, so loop through and delete any
          //missing files from our watched object

          if (typeof watched[dir] === 'undefined' || typeof watched[dir].files === 'undefined') { 
            return;
          }

          Object.keys(watched[dir].files).forEach(function _forEach(tFile) {
            var fPath = path.join(dir, tFile);
            fs.stat(fPath, function _stat(err, stats) {
              if (err) {
                //If we have a key for this, then its a dir. Recurse
                if (watched[fPath]) {
                  removeSubDir(fPath, fnRemove);
                }
                else {
                  delete(watched[dir].files[tFile]);     // Delete the entry from the parent
                  return fnRemove && fnRemove(null, fPath);
                }
              }
            });
          });
        }
    };
  };
}());
