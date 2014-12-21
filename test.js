/*var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/boldsite_test');



var api = require('./lib/zkbApi');


api.fetchData({'corp-id': 98276273}, true, function(err) {
  if (err) console.log("Failed: " + err);
  console.log("Populated data!");
});
*/

function addOrUpdate(killMails, callback) {
  var allIds = [];
  killMails.map(function(km){allIds.push(km.kmId)});
  callback (allIds);
}

var kms = [
  {
    kmId: 1,
    sif: 'a'
  },
  {
    kmId: 2,
    sif: 'b'
  },
  {
    kmId: 3,
    sif: 'ac'
  },
  {
    kmId: 4,
    sif: 'ad'
  },
  {
    kmId: 5,
    sif: 'ae'
  },
  {
    kmId: 6,
    sif: 'af'
  }
]

addOrUpdate(kms, function(ids){
  console.log(ids);
})
