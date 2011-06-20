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
    'calling stalker.watch': {
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
  }
}).export(module);

