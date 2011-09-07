stalker = require('../');

stalker.watch('./example', {norecurse: true}, function(err, f) { 
  if (err) {
    console.log('Error was ' + err);
    return;
  }
  console.log('I see ' + f); 
});

