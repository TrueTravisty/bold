var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
    
var Character = new Schema({
  CharacterID: Number,
  CharacterName: String,
  CharacterOwnerHash: String,
  User: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  Profile: String
});

module.exports = mongoose.model('Character', Character);