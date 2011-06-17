stalker = require('../');

stalker.watch('./example', function(err, f) { 
  if (err) {
    console.log('Error was ' + err);
    return;
  }
  console.log('Added: ' + f); 
}, function(err, f) {
  if (err) {
    console.log('Error was ' + err);
    return;
  }
  console.log('Removed: ' + f); 
});

