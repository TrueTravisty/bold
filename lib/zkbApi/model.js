var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var ZkbKill = new Schema({
  user: {type: Number, index: true},
  kmId: Number,
  time: {type: Date, index: true},
  content: String,
  value: {type: Number, index: true},
  kill: {type: Boolean, index: true, default: false}
});

ZkbKill.virtual('killmail').get(function() {
  return JSON.parse(this.content);
});

ZkbKill.virtual('killmail').set(function(killmail) {
  this.content = JSON.stringify(killmail);
});

module.exports = mongoose.model('ZkbKill', ZkbKill);
