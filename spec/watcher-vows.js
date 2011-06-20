var vows    = require('vows');
var assert  = require('assert');

var fs      = require('fs');
var path    = require('path');
var puts    = require('vows/console').puts( { stream: process.stdout } );

var tPath   = path.resolve('./spec');
var wMaker = require('../lib/watcher');

vows.describe('watcher').addBatch({
  'calling watcher': {
    topic: function () {
      return wMaker.makeWatcher();
    },
    'addFile with invalid path': {
      topic: function(watcher) {
        watcher.addFile('fakedir/blah/test', this.callback);
      },
      'calls back with error': function (err, file) {
        assert.match(err.message, /No such file or directory/);
      }
    },
    'addFile with valid path': {
      topic: function (watcher) {
        this.watcher = watcher;
        this.lPath = tPath + '/t4';
        try {
          fs.mkdirSync(this.lPath, '0755'); 
        }
        catch (Exception) {}
        var tStream = fs.createWriteStream(this.lPath + '/temp');
        tStream.end('fancy test file', 'utf8');
        watcher.addFile(this.lPath + '/temp', this.callback);
      },
      'calls back with no error': function (err) {
        assert.isUndefined(err);
      },
      'checkFile with file that has been added': {
        topic: function (err) {
          this.watcher.checkFile(this.lPath + '/temp', this.callback);
        },
        'calls back with true': function (err, result) {
          assert.isNull(err);
          assert.isTrue(result);
        }
      },
      'checkFile with file that has been not added': {
        topic: function (err) {
          this.watcher.checkFile('/fake/blah', this.callback);
        },
        'calls back with false': function (err, result) {
          assert.isNull(err);
          assert.isFalse(result);
        }
      }
    },
    'addFile with new file': {
      topic: function (watcher) {
        this.watcher = watcher;
        this.lPath = tPath + '/t3';
        try {
          fs.mkdirSync(this.lPath, '0755'); 
        }
        catch (Exception) {}
        var tStream = fs.createWriteStream(this.lPath + '/temp');
        tStream.end('fancy test file', 'utf8');
        watcher.addFile(this.lPath + '/temp', this.callback);
      },
      'then unlink the file': {
        topic: function () {
          fs.unlink(this.lPath + '/temp', this.callback);
        },
        'then call syncfolder': {
          topic: function () {
            this.watcher.syncFolder(this.lPath, this.callback);
          },
          'calls remove callback with file': function (err, file) {
            assert.isNull(err);
            assert.equal(file, this.lPath + '/temp');
          },
          'then call checkFile': {
            topic: function (err) {
              this.watcher.checkFile(this.lPath + '/temp', this.callback);
            },
            'calls back with false': function (err, result) {
              assert.isNull(err);
              assert.isFalse(result);
            }
          }
        }
      }
    }
  }
}).addBatch({
  'cleanup': {
    'delete files': function () {
      fs.rmdirSync(tPath + '/t3'); 
      try {
        fs.unlinkSync(tPath + '/t4/temp');
      }
      catch (Exception) { 
        //Do nothing 
      }
      fs.rmdirSync(tPath + '/t4'); 
    }
  }
}).export(module);

