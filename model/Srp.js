var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var Srp = new Schema({
  username: {type: String, index: true},
  zkbID: {type: Number, index: {unique: true, dropDups: true}},
  ship: String,
  class: String,
  lost: Number,
  paid: Number,
  denied: {type: Boolean, default: false},
  paid_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

module.exports = mongoose.model('Srp', Srp);
