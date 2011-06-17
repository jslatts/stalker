describe('stalker', function () {
  var path  = require('path');
  var fs    = require('fs');
  var tPath = path.resolve('./spec');

  var s;
  beforeEach(function() {
    s = require('../lib/stalker');
  });

  afterEach(function() {
    fs.unlink(tPath + '/temp');
  });

  it('should throw an exception when no options or function is passed', function () {
    expect(function() {
      s.watch('fakedir');
    }).toThrow({
        name    : 'TypeError',
        message : 'Must provide a callback function'
      });
  });

  it('should throw an exception when options is passed and function is not passed', function () {
    expect(function() {
      s.watch('fakedir', {buffer: 1000});
    }).toThrow({
        name    : 'TypeError',
        message : 'Must provide a callback function'
      });
  });

  it('should call callback with an error when path is not found after calling watch when in instant mode', function () {
    var error;
    var callback = function(err) {
      if (err) {
        error = err;
      }
    };

    s.watch('fakedir/blah/test', callback);

    waitsFor(function () {
      return error;
    }, 'error to be set', 200);

    runs(function() {
      expect(error).toMatch(/Path does not exist/);
    });
  });

  it('should call callback with an error when path is not found after calling watch in buffer mode', function () {
    var error;
    var callback = function(err) {
      if (err) {
        error = err;
      }
    };

    s.watch('fakedir/blah/test', {buffer: 1000}, callback);

    waitsFor(function () {
      return error;
    }, 'error to be set', 200);

    runs(function() {
      expect(error).toMatch(/Path does not exist/);
    });
  });

  it('should fire first callback when a file is dropped', function() {
    var file;
    var callback = function(err, f) {
      if (f) {
        file = f;
      }
    };

    s.watch(tPath, callback);

    runs(function (){
      var rPath = tPath + '/temp';
      var tStream = fs.createWriteStream(rPath);
      tStream.end('fancy test file', 'utf8');
    });

    waits(1000);   // For some reason this + the waitsFor() need to

    waitsFor(function () {
      return file;
    }, 'file to be set', 5000);

    runs(function() {
      expect(file).toMatch(tPath + '/temp');
    });
  });

  it('should fire second callback when a file is removed', function() {
    var file;

    function removeCallback(err, f) {
      if (f === tPath + '/temp') {
        file = f;
      }
    }

    s.watch(tPath, function(){}, removeCallback);

    runs(function (){
      var rPath = tPath + '/temp';
      var tStream = fs.createWriteStream(rPath);
      tStream.end('fancy test file', 'utf8');
    });

    waits(1000);   // For some reason this + the waitsFor() need to
                   // sum to 5000 before the unlink is detected

    runs(function() {
      fs.unlink(tPath + '/temp');
    });

    waitsFor(function () {
      return file;
    }, 'file to be set', 5000);

    runs(function() {
      expect(file).toMatch(tPath + '/temp');
    });
  });

});

describe('watcher.addFile', function () {
  var path  = require('path');
  var fs    = require('fs');
  var tPath = path.resolve('./spec');

  var s;
  beforeEach(function() {
    s = require('../lib/watcher').makeWatcher();
  });

  it('should call back with an error when path is not found', function () {
    var error;
    var callback = function(err) {
      if (err) {
        error = err;
      }
    };

    s.addFile('fakedir/blah/test', callback);

    waitsFor(function () {
      return error;
    }, 'error to be set', 200);

    runs(function() {
      expect(error).toMatch(/No such file or directory/);
    });
  });
  it('should call back without an error if path is found', function () {
    var done;
    var callback = function(err) {
      if (!err) {
        done = true;
      }
    };

    s.addFile(tPath, callback);

    waitsFor(function () {
      return done;
    }, 'callback', 200);

    runs(function() {
      expect(done).toEqual(true);
    });
  });
});

describe('watcher.checkFile', function () {
  var path  = require('path');
  var fs    = require('fs');
  var tPath = path.resolve('./spec');

  var s;
  beforeEach(function() {
    s = require('../lib/watcher').makeWatcher();
  });

  afterEach(function() {
    fs.unlink(tPath + '/temp');
  });

  it('should respond with true once a file is added', function () {
    var result;
    var callback = function(err, r) {
      if (!err) {
        result = r;
      }
    };

    s.addFile(tPath, function() {
      s.checkFile(tPath, callback);
    });

    waitsFor(function () {
      return result;
    }, 'callback', 200);

    runs(function() {
      expect(result).toEqual(true);
    });
  });

  it('should respond with false if a file has not been added', function () {
    var result = null;
    s.checkFile(tPath, function(err, r) {
      if (!err) {
        result = r;
      }
    });

    waitsFor(function () {
      return (result !== null);
    }, 'callback', 200);

    runs(function() {
      expect(result).toEqual(false);
    });
  });

  it('should respond with false after a file has been added, deleted, then synched', function () {
    var rPath = tPath + '/temp';
    var tStream = fs.createWriteStream(rPath);
    tStream.end('fancy test file', 'utf8');


    var result = null;
    runs(function() {
      s.addFile(rPath, function _addFile() {
        fs.unlink(rPath, function _unlink() {
          s.syncFolder(tPath, function _syncFolder() {
            s.checkFile(rPath, function _checkFile(err, r) {
              result = r;
            });
          });
        });
      });
    });

    waitsFor(function () {
      return (result !== null);
    }, 'callback', 1000);

    runs(function() {
      expect(result).toEqual(false);
    });
  });
});
