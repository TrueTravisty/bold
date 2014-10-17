
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/boldsite_test');

var api = require('./model/EveXmlApi');
debugger;

api.eveApi('eve/CharacterInfo.xml.aspx', {characterID:94331649}, function(err, result) {
  if (err) return console.log("Error: " + err);
  return console.log(JSON.stringify(result));
});


