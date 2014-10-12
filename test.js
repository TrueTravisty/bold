var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/boldsite');

var Settings = require('./model/SettingsStore');
var User = require('./model/User');

var settings = {};

User.findOne({username:'torlivar'}, function(err, user) {
  debugger;
  Settings.set('test', 'updated again',user,function(err) {
    if (err) throw err;
      
    for (setting in Settings.settings) {
      console.log(setting + ": " + JSON.stringify(Settings.settings[setting]));
    }
  
  });

});