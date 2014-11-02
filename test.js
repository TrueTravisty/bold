/*
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/boldsite_test');



var api = require('./lib/zkbApi');


api.fetchData({'corp-id': 98276273}, function(err) {
  if (err) console.log("Failed: " + err);
  console.log("Populated data!");
});
*/

var reddit = require('./lib/reddit');

reddit.addUser({
    'reddit-modhash': 'x0qgjkudun7585ff2772217c29e6809c24c27f0f6b1bb2d4bc',
    'reddit-cookie': '32184941,2014-11-02T02:45:57,13c718b77da322f8f39088ee1ffbbf521ba2bfc2',
    'reddit-subredditfullname' : 't5_31b8o',
    'reddit-subreddit' : 'braveoperations'
  },
  'torli',
  function(err) {
    if (err){
      console.log("Error adding user");
      console.log(err);
      return;
    }
    console.log("User added");
  })
