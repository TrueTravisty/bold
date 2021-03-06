var fs = require('fs');
var env = null;

try{
    if(fs.statSync('env.json').isFile()){    
      var env = JSON.parse(fs.readFileSync('env.json', 'utf8'));
      if (env) {
        for (var attrname in env) { process.env[attrname] = env[attrname] }
      }  
    }
} catch (e) {
  console.log("Could not read env")
}



var seatdb = require('./lib/seatdb');

seatdb.getMembers(98276273, function(err, characters) {
  if (err) return console.log(err);
  for (var id in characters) {
    console.log(characters[id].name + " " + characters[id].isOk + " " + characters[id].startDateTime);
  }
  console.log("Count: " + characters.length);
  process.exit();
});


/*


var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/boldsite_test');



var api = require('./lib/zkbApi');
var model = require('./lib/zkbApi/model').Losses;

model.remove({}, function(err) {

  var testData = [
    {
      kmId: 0,
      time: new Date(),
      user: 0,
      requested: false
    },
    {
      kmId: 1,
      time: new Date(),
      user: 0,
      requested: true
    },
    {
      kmId: 2,
      time: new Date(),
      user: 0,
      requested: true,
      denied: true
    },
    {
      kmId: 3,
      time: new Date(),
      user: 0,
      requested: true,
      denied: true,
      paid: 4
    },
    {
      kmId: 4,
      time: new Date(),
      user: 0,
      requested: true,
      denied:false,
      paid:0
    },
    {
      kmId: 5,
      time: new Date(),
      user: 0,
      requested: true,
      paid: 0
    },
    {
      kmId: 6,
      time: new Date(),
      user: 0,
      requested: true,
      denied: false,
      paid: 49
    },
    {
      kmId: 7,
      time: new Date(),
      user: 0,
      requested: true,
      paid: 392
    },
    {
      kmId: 8,
      time: new Date(),
      user: 0,
      requested: false
    }
  ];

  model.create(testData, function(err) {
    if (err) return console.log("Error: " + err);
    api.getUnhandledSrpRequests(function (err, result){
      if (err) return console.log("Error: " + err);
      console.log("Found " + result.length + " requests: ");
      for (var i = 0; i < result.length; i++) {
        console.log(JSON.stringify(result[i]));
      }
    });
  });

});
*/