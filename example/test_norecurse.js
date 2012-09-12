stalker = require('../');

stalker.watch('./example', {recurse: false}, function(err, f) { 
  if (err) {
    console.log('Error was ' + err);
    return;
  }
  console.log('I see ' + f); 
});

