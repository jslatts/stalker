stalker = require('../');

stalker.watch('./example', function(err, f) { 
  if (err) {
    console.log('Error was ' + err);
    return;
  }
  console.log('I see ' + f); 
});

stalker.watch('./example/inner', function(err, f) { 
  if (err) {
    console.log('Error was ' + err);
    return;
  }
  console.log('I see ' + f); 
});

setTimeout(function() {
  console.log('Police were called. I\'m out.') //WTF?
  stalker.stop('./example')
}, 5000);
