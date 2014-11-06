var model = require('./model');

function updateAll(callback) {
  model.find({value:null}, function(err, result){
    if (err) return callback(err);
    for (var i=0, l = result.length; i < l; ++i) {
      var km = result[i].killmail;
      if (km.zkb) {
        result[i].value = km.zkb.totalValue;
        result[i].save();
      }
    }

  });
}

module.exports = updateAll;
