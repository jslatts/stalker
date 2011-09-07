stalker = require('../');

stalker.watch('./example', {recurse: false, buffer: 5000}, function _add(err, f) { 
  if (err) {
    console.log('Error was ' + err);
    return;
  }
  f.forEach(function _forEach(_f) {
    console.log('Added:  ' + _f); 
  });
}, function _remove(err, f) {
  if (err) {
    console.log('Error was ' + err);
    return;
  }
  f.forEach(function _forEach(_f) {
    console.log('Remove: ' + _f); 
  });
});

