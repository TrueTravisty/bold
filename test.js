var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/boldsite_test');



var api = require('./lib/zkbApi');


api.fetchData({'corp-id': 98276273}, true, function(err) {
  if (err) console.log("Failed: " + err);
  console.log("Populated data!");
});
