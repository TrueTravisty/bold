var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    passportLocalMongoose = require('passport-local-mongoose');
    


var User = new Schema({
  roles: [String],
  displayname: String,
  email: String,
  verified: Boolean,
  characters: [String],
  api: String,
  apiVer: String
});

User.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', User);