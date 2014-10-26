var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var Srp = new Schema({
  User: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  zkillboard: String,
  ship: String,
  class: String,
  lost: Number,
  paid: Number,
  denied: Boolean,
  paid_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

module.exports = mongoose.model('Api', Api);
