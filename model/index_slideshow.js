var mongoose = require('mongoose');

var schema = new mongoose.Schema({
  caption: String,
  path: String
});

module.exports = mongoose.model('Slideshow', schema);
