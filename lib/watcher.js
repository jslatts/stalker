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
    return {
      checkFile: function (fPath, fn) {
                   //console.log('\n\n');
                   //console.log('watcher.checkfile called %s\n', fPath);
                   //console.dir(watched);
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

                       return fn && fn(null, watched[dir].files[base] === stats.mtime.valueOf());
                     });
                   }
                 },
        addFile: function (fPath, fn) {
                   //console.log('\n\n');
                   //console.log('watcher.addfile called %s\n', fPath);
                   //console.dir(watched);
                   var dir  = path.dirname(fPath);
                   var base = path.basename(fPath);

                   if (typeof watched[dir] === 'undefined') { watched[dir] = {}; }
                   if (typeof watched[dir].files === 'undefined') { watched[dir].files = {}; }

                   fs.stat(fPath, function onStat(err, stats) {
                     if (err) { return fn && fn(err); }
                     watched[dir].files[base] = stats.mtime.valueOf();

                     return fn && fn();
                   });
                 },
        reset: function (fPath, fn) {
                 //console.log('\n\n');
                 //console.log('watcher.reset called %s\n', fPath);
                 //console.dir(watched);
                 delete(watched[fPath]);
                 return fn && fn();
               },
        syncFolder: function(dir, fn) {
                     //console.log('\n\n');
                     //console.log('watcher.syncfolder called %s\n', dir);
                     //console.dir(watched);
                      //Ugly, but we can't tell if something is gone, so loop through and delete any
                      //missing files from our watched object

                      if (typeof watched[dir] === 'undefined' || typeof watched[dir].files === 'undefined') { 
                        return fn && fn(); //nothing to do
                      }

                      Object.keys(watched[dir].files).forEach(function _forEach(tFile) {
                        var fPath = path.join(dir, tFile);
                        fs.stat(fPath, function _stat(err, stats) {
                          if (err) {
                            delete(watched[dir].files[tFile]); //Delete the entry from the parent
                            delete(watched[fPath]); //Delete the entry if it has been used as a base as well
                          }
                        });
                      });

                      return fn && fn();
                    }
    };
  };
}());
