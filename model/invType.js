var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var InvType = new Schema({
  typeID: Number,
  groupID: Number,
  typeName: String,
  description: String,
  mass: Number,
  volume: Number,
  capacity: Number,
  portionSize: Number,
  raceID: Number,
  published: Number,
  marketGroupID: Number,
  chanceOfDuplicating: Number
}, { collection : 'invTypes' });

module.exports = mongoose.model('invType', InvType);
