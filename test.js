
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/boldsite_test');

var api = require('./model/EveXmlApi');

api.callApi('eve/CharacterInfo.xml.aspx', {characterID:94361861}, function(err, result) {
  if (err) return console.log("Error: " + err);
  return console.log(result);
});


