describe('stalker', function () {
  it('should call callback with an error when path is not found after calling watch', function () {
    var s = require('../lib/stalker');

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

  it('should respond with false after a file has been added, deleted, then sycned', function () {
    var rPath = tPath + '/temp';
    var tStream = fs.createWriteStream(rPath);
    tStream.end('fancy test file', 'utf8');


    var result = null;
    s.addFile(rPath, function _addFile() {
      fs.unlink(rPath, function _unlink() {
        s.syncFolder(tPath, function _syncFolder() {
          s.checkFile(rPath, function _checkFile(err, r) {
            result = r;
          });
        });
      });
    });

    waitsFor(function () {
      return (result !== null);
    }, 'callback', 200);

    runs(function() {
      expect(result).toEqual(false);
    });
  });
});
