var zkbModels = require('./model');
var zkbConnect = require('./index')

Kills = zkbModels.Kills;
Losses = zkbModels.Losses;


function fetchNew(settings, kills, callback) {
  var model = kills ? Kills : Losses;
  model.count({}, function(err, c) {
    if (err) return callback(err);
    if (c == 0) initialFetch(settings, model, callback);
    else fetchNewer(settings, model, callback);
  });

}

function fetchNewer(settings, model, callback) {
  var beginDate = new Date();
  beginDate.setMonth(beginDate.getMonth()-2);
  var corpId = settings['corp-id'];

  model.find({}).sort('-time').limit(1).select('kmId').exec(function(err, result) {
    if (err) return callback(err);
    if (result && result.length == 1) {
      var kmId = result[0].kmId;
      var modifier = '/afterKillID/' + kmId;
      fetchPage(corpId, modifier, model, 1, callback);
    } else {
      var err = new Error("Found none");
      return callback(err);
    }
  });

}

function initialFetch(settings, model, callback) {
  var beginDate = new Date();
  beginDate.setMonth(beginDate.getMonth()-2);
  var corpId = settings['corp-id'];
  var startTime = zkbDateFormat(beginDate);
  var modifier = '/startTime/' + startTime;
  fetchPage(corpId, modifier, model, 1, callback);
}

function fetchPage(corpId, modifier, model, page, callback) {
  var type = model === Kills ? 'kills' : 'losses';
  zkbConnect.getData(type + '/corporation/' + corpId + modifier
                      + '/page/' + page + '/', function(err, result) {
    if (err || !result || !result.data || !Array.isArray(result.data) || result.data.length == 0) return callback(err);
    var data = result.data;
    var len = data.length;
    var killMails = [];
    for (var i = 0; i < len; ++i) {
      var wt = new Date(Date.parse(data[i].killTime));
      var correctTime = new Date(wt.getTime() - wt.getTimezoneOffset()*60*1000);

      killMails.push({
        user: data[i].victim ? data[i].victim.characterID : null,
        kmId: data[i].killID,
        time: correctTime,
        content: JSON.stringify(data[i]),
        value: data[i].zkb ? data[i].zkb.totalValue : null
      });
    }
    addOrUpdate(killMails, model, function(err) {
      if (err) return callback(err);
      fetchPage(corpId, modifier, model, page + 1, callback);
    });
  })
}

function addOrUpdate(killMails, model, callback) {
  var allIds = [];
  killMails.map(function(km){allIds.push(km.kmId)});
  model.find({kmId: {$in: allIds}}).select('kmId').exec(function(error, result) {
    if (error) return callback(error);

    var newKms = [];
    var updateKms = [];

    killMails.map(function(km) {
      if (result.some(function(m) {
        return m.kmId == km.kmId
      })) {
        updateKms.push(km);
      } else {
        newKms.push(km);
      }
    });
    console.log("Updating " + updateKms.length + " record(s)");
    for (var i = 0, l = updateKms.length; i < l; ++i)
      model.update({kmId: updateKms[i].kmId},updateKms[i]);
    console.log("Adding " + newKms.length + " record(s)");
    model.create(newKms, callback);
  });
}

function zkbDateFormat(d) {
  return '' + d.getUTCFullYear() + pad(d.getUTCMonth()) + pad(d.getUTCDate())
            + pad(d.getUTCHours()) + pad(d.getUTCMinutes());
}

function pad(number) {
  if (number < 10)
    return '0' + number;
  return '' + number;
}

exports.fetchNew = fetchNew;
