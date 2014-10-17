var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
    
var Api = new Schema({
  User: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  key: Number,
  code: String
});

module.exports = mongoose.model('Api', Api);