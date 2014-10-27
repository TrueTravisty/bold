
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/boldsite_test');

var api = require('./lib/zkbApi');
;

api.getData('killID/41880193/', function(err, result) {
  if (err) return console.log(err);
  console.log(JSON.stringify(result));
});
