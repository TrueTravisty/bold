/*
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/boldsite_test');



var api = require('./lib/zkbApi');


api.fetchData({'corp-id': 98276273}, function(err) {
  if (err) console.log("Failed: " + err);
  console.log("Populated data!");
});
*/
var now = new Date();
var minute = [(now.getMinutes() + 2)%60, (now.getMinutes() + 32)%60];
console.log(JSON.stringify(minute));
