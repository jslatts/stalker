describe('stalker', function () {
  it('should call call back with an error when path is not found', function () {
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
    }, 'error was not set', 200);

    runs(function() {
      expect(error).toMatch(/Path does not exist/);
    });
  });
});

describe('watcher', function () {
  it('should call back with an error when path is not found', function () {
    var s = require('../lib/watcher').makeWatcher();

    //Figure out why this test fails
    var error;
    var callback = function(err) {
      if (err) {
        error = err;
      }
    };

    s.addFile('fakedir/blah/test', callback);

    waitsFor(function () {
      return error;
    }, 'error was not set', 200);

    runs(function() {
      expect(error).toMatch(/No such file or directory/);
    });
  });
});
