var defaultSettings = require("./settings.json");

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;   


var SettingsStoreSchema = new Schema({
  name: String,
  version: Number,
  value: String,
  current: Boolean,
  setAt: { type: Date, default: Date.now },
  setBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

var SettingsStore = mongoose.model('Settings', SettingsStoreSchema);

var Settings = {
  settings: {},
  permissions: {}
}

populateSettings(function(err, s) {
  if (err) throw err;
  Settings.settings = s;
});

function populateSettings (callback) {
  debugger;
  var settings = {};
  for (setting in defaultSettings) {
      settings[setting] = defaultSettings[setting].defaultvalue;
      Settings.permissions[setting] = defaultSettings[setting].permission;
  }
  SettingsStore.find({'current': true}, 'name value', function (err, result) {
    if (err) {callback(err);}
    for (var i = 0; i < result.length; i++) {
      settings[result[i].name] = result[i].value;
    }  
    callback(null, settings);
  });
}

function setSetting(setting, value, user, version, callback) {
  debugger;
  var store = new SettingsStore({
    name: setting,
    value: value,
    version: version,
    current: true,
    setBy: user._id
  });
  store.save(function(err) {
    Settings.settings[setting] = value;
    callback(err);
  });
}

Settings.set = function (setting, value, user, callback) {
  SettingsStore.findOne ({'name': setting, 'current': true}, function (err, result) {
    if (err) return callback (err);
    var version = 1;
    if (result) {
      version = result.version + 1;
      result.current = false;
      result.save(function (err) {
        if (err) return callback (err);
        setSetting(setting, value, user, version, callback);
      });
    } else {
      setSetting(setting, value, user, version, callback);
    }
  });
}

module.exports = Settings;