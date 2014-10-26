var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    passportLocalMongoose = require('passport-local-mongoose');



var User = new Schema({
  roles: [String],
  displayname: String,
  email: String,
  verified: Boolean,
  characterID: String,
  APIs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Api'}]
});

User.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', User);
