stalker = require('../');

stalker.watch('./example', {strict: true}, function(err, f) { 
  if (err) {
    console.log('Error was ' + err);
    return;
  }
  console.log('I see ' + f); 
});

