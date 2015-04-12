var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var Character = new Schema({
  CharacterID: Number,
  CharacterName: String,
  CharacterOwnerHash: String,
  User: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  Validated: Boolean,
  APIs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Api'}]
});

module.exports = mongoose.model('Character', Character);
