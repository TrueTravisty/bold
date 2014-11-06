var zkbKill = require('./model');
var zkbConnect = require('./index')


function fetchNew(settings, kills, callback) {
  zkbKill.count({kill: kills}, function(err, c) {
    if (err) return callback(err);
    if (c == 0) initialFetch(settings, kills, callback);
    else fetchNewer(settings, kills, callback);
  });

}

function fetchNewer(settings, kills, callback) {
  var beginDate = new Date();
  beginDate.setMonth(beginDate.getMonth()-2);
  var corpId = settings['corp-id'];

  zkbKill.find({kill: kills}).sort('-time').limit(1).select('kmId').exec(function(err, result) {
    if (err) return callback(err);
    if (result && result.length == 1) {
      var kmId = result[0].kmId;
      var modifier = '/afterKillID/' + kmId;
      fetchPage(corpId, modifier, kills, 1, callback);
    } else {
      var err = new Error("Found none");
      return err;
    }
  });

}

function initialFetch(settings, kills, callback) {
  var beginDate = new Date();
  beginDate.setMonth(beginDate.getMonth()-2);
  var corpId = settings['corp-id'];
  var startTime = zkbDateFormat(beginDate);
  var modifier = '/startTime/' + startTime;
  fetchPage(corpId, modifier, kills, 1, callback);
}

function fetchPage(corpId, modifier, kills, page, callback) {
  var type = kills ? 'kills' : 'losses';
  zkbConnect.getData(type + '/corporation/' + corpId + modifier
                      + '/page/' + page + '/', function(err, result) {
    if (err || !result || !result.data || !Array.isArray(result.data) || result.data.length == 0) return callback(err);
    var data = result.data;
    var len = data.length;
    var killMails = [];
    for (var i = 0; i < len; ++i) {
      killMails.push({
        user: data[i].victim ? data[i].victim.characterID : null,
        kmId: data[i].killID,
        time: new Date(Date.parse(data[i].killTime)),
        content: JSON.stringify(data[i]),
        value: data[i].killmail.zkb ? data[i].killmail.zkb.totalValue : null,
        kill: kills
      });
    }
    zkbKill.create(killMails, function(err) {
      if (err) return callback(err);
      fetchPage(corpId, modifier, kills, page + 1, callback);
    });
  })
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
