var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var Srp = new Schema({
  username: String,
  zkbID: {type: Number, index: {unique: true, dropDups: true}},
  ship: String,
  class: String,
  lost: Number,
  paid: Number,
  denied: Boolean,
  paid_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

module.exports = mongoose.model('Srp', Srp);
