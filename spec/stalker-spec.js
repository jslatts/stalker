describe('stalker', function () {
  it('watch should call call back with an error when path is not found', function () {
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

describe('watcher', function () {
  it('addFile should call back with an error when path is not found', function () {
    var s = require('../lib/watcher').makeWatcher();

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
  it('addFile should call back without an error if path is found', function () {
    var s = require('../lib/watcher').makeWatcher();

    var done;
    var callback = function(err) {
      if (!err) {
        done = true;
      }
    };

    var path = require('path');
    var tPath = path.resolve('.');
    s.addFile(tPath, callback);

    waitsFor(function () {
      return done;
    }, 'callback', 200);

    runs(function() {
      expect(done).toEqual(true);
    });
  });
  it('checkFile should respond with true once a file is added', function () {
    var s = require('../lib/watcher').makeWatcher();

    var result;
    var callback = function(err, r) {
      if (!err) {
        result = r;
      }
    };

    var path = require('path');
    var tPath = path.resolve('.');
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
  it('checkFile should respond with false if a file has not been added', function () {
    var s = require('../lib/watcher').makeWatcher();

    var path = require('path');
    var tPath = path.resolve('.');

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
});
