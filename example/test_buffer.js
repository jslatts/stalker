stalker = require('../');

stalker.watch('./example', {buffer: 5000}, function(err, f) { 
  if (err) {
    console.log('Error was ' + err);
    return;
  }
  f.forEach(function _forEach(_f) {
    console.log('I see ' + _f); 
  });
});

