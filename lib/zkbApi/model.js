var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var ZkbKill = new Schema({
  user: {type: Number, index: true},
  kmId: {type: Number, index: {unique: true, dropDups: true}},
  time: {type: Date, index: true},
  content: String,
  value: {type: Number, index: true}
});

ZkbKill.virtual('killmail').get(function() {
  return JSON.parse(this.content);
});

ZkbKill.virtual('killmail').set(function(killmail) {
  this.content = JSON.stringify(killmail);
});

module.exports.Kills = mongoose.model('ZkbKill', ZkbKill);
module.exports.Losses = mongoose.model('ZkbLoss', ZkbKill);
