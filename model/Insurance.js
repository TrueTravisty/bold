var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var Insurance = new Schema({
  shipid: {type: Number, index: {unique: true, dropDups: true}, required: true},
  shipname: String,
  insurance: Number,
  setAt: { type: Date, default: Date.now },
  setBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

module.exports = mongoose.model('Insurance', Insurance);
