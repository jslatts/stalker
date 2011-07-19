var vows = require('vows');
var assert = require('assert');

var fs    = require('fs');
var path  = require('path');
var puts = require('vows/console').puts( { stream: process.stdout } );

var tPath = path.resolve('./spec');
var stalker = require('../');

vows.describe('stalker').addBatch({
  'calling watch with invalid parameters': {
    'throws exception when no options or function is passed': function () {
      assert.throws(function() {
        stalker.watch('fakedir');
      }, typeof TypeError);
    },
    'throw exception when options without function is passed': function () {
      assert.throws(function() {
        stalker.watch('fakedir', {buffer: 1000});
      }, typeof TypeError);
    }
  },
  'calling watch on non-existant path in instant mode': {
    topic: function() {
      stalker.watch('fakedir/blah/test', this.callback);
    },
    'calls back with error when path not found': function (err, file) {
      assert.match(err, /Path does not exist/);
    }
  },
  'calling watch on non-existant path in buffer mode': {
    topic: function () {
      stalker.watch('fakedir/blah/test', {buffer: 1000}, this.callback);
    },
    'calls back with error when path not found': function (err, file) {
      assert.match(err, /Path does not exist/);
    }
  },
 'file dropping in watched dir': {
    topic: function () {
      var lPath = tPath + '/t1';
      try {
        fs.mkdirSync(lPath, '0755'); 
      }
      catch (Exception) {}
      return lPath;
    },
    'calling stalker.watch': {
      topic: function (lPath) {
        this.lPath = lPath;
        stalker.watch(lPath, this.callback);
        var rPath = lPath + '/temp';
        var tStream = fs.createWriteStream(rPath);
        tStream.end('fancy test file', 'utf8');
      },
      'fires first callback': function (err, file) {
        var lPath = this.lPath;
        assert.isNull(err);
        assert.equal(file, lPath + '/temp');
        fs.unlink(lPath + '/temp', function () {
          fs.rmdirSync(lPath); 
        });
      }
    }
  },
  'file remove in watched dir': {
    topic: function () {
      var lPath = tPath + '/t2';
      try {
        fs.mkdirSync(lPath, '0755'); 
      }
      catch (Exception) {}
      return lPath;
    },
    'calling stalker.watch with remove callback': {
      topic: function (lPath) {
        this.lPath = lPath;
        stalker.watch(lPath, 
          function(err, file) {
            setTimeout(function() {
              fs.unlink(file);
            }, 1000);
          }, this.callback);
        var rPath = lPath + '/temp';
        var tStream = fs.createWriteStream(rPath);
        tStream.end('fancy test file', 'utf8');
      },
      'fires second callback': function (err, file) {
        assert.isNull(err);
        assert.equal(file, this.lPath + '/temp');
        fs.rmdirSync(this.lPath); 
      }
    }
  },
  'created temporary directory t3': {
    topic: function () {
      var lPath = tPath + '/t3';
      try {
        fs.mkdirSync(lPath, '0755'); 
      }
      catch (Exception) {}
      return lPath;
    },
    'then called stalker.watch and updated one file': {
      topic: function (lPath) {
        this.lPath = lPath;

        var rPath1 = lPath + '/temp1';
        var tStream = fs.createWriteStream(rPath1);
        tStream.end('fancy test file1', 'utf8');

        var rPath2 = lPath + '/temp2';
        tStream = fs.createWriteStream(rPath2);
        tStream.end('fancy test file2', 'utf8');
        
        this.addCallBackFired = {};

        var that = this;
        stalker.watch(lPath, function(err, file) {
            if (typeof that.addCallBackFired[file] === 'undefined') {
              that.addCallBackFired[file] = false;
            }
            else {
              that.addCallBackFired[file] = true;
            }
          }, function(err, file) {
            setTimeout(function() {
              that.callback(err, file);
            }, 1000);
          });

        //After a second, modify one of the watched files and set a timer to 
        //unlink the other. 
        setTimeout(function() {
          var tStream = fs.createWriteStream(rPath2);
          tStream.end('fancy test file2 update', 'utf8');

          setTimeout(function() {
            fs.unlink(rPath1);
          }, 1000);
        }, 1000);

      },
      'expected not to fire callback for existing file': function (err, file) {
        assert.isNull(err);
        assert.equal(file, this.lPath + '/temp1');

        assert.isFalse(this.addCallBackFired[this.lPath + '/temp2']);

        var lPath = this.lPath;
        fs.unlink(lPath + '/temp2', function () {
          fs.rmdirSync(lPath); 
        });
      }
    }
  }
}).export(module);

