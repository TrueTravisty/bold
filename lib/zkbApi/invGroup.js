var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var InvGroup = new Schema({
  groupID: {type: Number, index: true},
  categoryID: Number,
  groupName: String,
  description: String,
  iconID: Number,
  useBasePrice: Number,
  allowManufacture: Number,
  allowRecycler: Number,
  anchored: Number,
  anchorable: Number,
  fittableNonSingleton: Number,
  published: Number
}, { collection : 'invGroups' });

module.exports = mongoose.model('invGroup', InvGroup);
