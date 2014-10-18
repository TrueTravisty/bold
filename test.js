
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/boldsite_test');

var api = require('./lib/eveApi');
debugger;

api.getPublicCharacterInfo(94449671, function(err, result) {
  if (err) return console.log(err);
  debugger;
  console.log("Character: " + result.characterName);
  console.log("Corp: " + result.corporation);

});
