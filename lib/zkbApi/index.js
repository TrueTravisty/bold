var https = require('https');
var zlib = require('zlib');
var apiCache = require('../eveApi').cacheModel;
var fetch = require('./fetch');
var zkbModels = require('./model');
var dbInfo = require('./dbInfo');
var invType = require('./invType')
_ = require('underscore');

var Kills = zkbModels.Kills;
var Losses = zkbModels.Losses;


function getZkbDataFromCache(path, callback) {
  var cachepath = "https://zkillboard.com/api/" + path;
  apiCache.findOne({path: cachepath}, function(err, result){
    if (err) return callback(err);
    if (result) {
      var zkbData = {
        data: JSON.parse(result.result),
        fromCache: true,
        cachedUntil: result.cacked_until
      };
      return callback(null, zkbData);
    }

    getZkbData(path, function(err, headers, result) {
      if (err) return callback(err);
      var cacheTime = new Date(Date.parse(headers.expires));
      var newEntry = new apiCache({path:cachepath, result: result, cached_until: cacheTime});
      newEntry.save(function(err) {
        var zkbData  =  {
          data: JSON.parse(result),
          fromCache: false,
          cachedUntil: newEntry.cacked_until
        };
        return callback(null, zkbData);
      })
    });
  });
}

function getZkbData(path, callback) {

  console.log("Fetching https://zkillboard.com/api/" + path );

  var options = {
    host: 'zkillboard.com',
    path: '/api/' + path,
    headers: {
      'Accept-Encoding': 'gzip',
      'User-Agent': 'BO-LD app Maintainer: torlivar Mail: yaldo@torlivar.net'
    }
  }

  var gunzip = zlib.createGunzip();

  https.get(options, function(res) {

    var body = '';
    var output;
    switch ( res.headers[ 'content-encoding' ] ) {
      case 'gzip':
        res.pipe(gunzip);
        output = gunzip;
        break;
      default:
        res.setEncoding('utf8');
        output = res;
    }

    output.on('data', function(data){
      body += data;
    });

    output.on('end', function() {
      callback(res.statusCode >= 400 ? "ZKB error" : null, res.headers, body);
    })
  }).on('error', function(err) {
    callback(err);
  });
}

function getZbkLossesForCharacter(characterId, maxCount, skip, callback) {
  if (_.isFunction(skip)) {
    return getZbkLossesForCharacter(characterId, maxCount, 0, skip)
  }
  Losses.find({user: characterId}).sort('-time').limit(maxCount).skip(skip).exec(function(err, result) {
    returnKills(err, result, callback);
  });
}



function getToppKillList(maxCount, days, kills, callback) {
  var now = new Date();
  var min = now.setDate(now.getDate()-days);
  var model = kills ? Kills : Losses;

  model.find({time: {$gte: min}}).sort('-value').limit(maxCount).exec(function(err, result) {
    returnKills(err, result, callback);
  });
}

function returnKills(err, result, callback) {
  if (err) return callback(err);
  var kills = [];
  var len = result.length;
  for (var i = 0; i < len; ++i) {
    kills.push(result[i].killmail);
  }
  dbInfo.getDbInfo(kills, callback);
}

function getLatestKills(maxCount, callback) {
  Kills.find({}).sort('-time').limit(maxCount).exec(function(err, result) {
    returnKills(err, result, callback);
  });
}

function getLatestLosses(maxCount, callback) {
  Losses.find({}).sort('-time').limit(maxCount).exec(function(err, result) {
    returnKills(err, result, callback);
  });
}

function getLoss(kmId, callback) {
  Losses.find({kmId: kmId}, function(err, result) {
    if (err) return callback(err);
    if (result.length < 1) {
      var err = new Error("Lossmail not found");
      err.status = 404;
      return callback(err);
    }
    return callback(null, result[0]);
  });
}

function getUnhandledSrpRequests(callback) {
  Losses.find({
      requested: true,
      $and: [
        {$or: [{denied: null},{denied: false}]},
        {$or: [{paid:null}, {paid:0}]}
      ]
    }, function(err, result) {
      returnKills(err, result, callback);
    });
}

function getTypeName(id, callback) {
  invType.findOne({typeID: id}, function(err, res) {
    if (err) return callback(err);
    if (res) return callback(null, res.typeName);
    return callback(null, null);
  });
}

function getDataWithoutCache(path, callback) {
  getZkbData(path, function(err, headers, result) {
    if (err) return callback(err);
    if (result && result.length > 0) {
      try {
        var zkbResult = {        
          data: JSON.parse(result)
        }        
      } catch (e) {
        return callback(e);
      }
      return callback(null, zkbResult);
    } else {
      console.log("No data from zkillboard");
      console.log("Headers: " + JSON.stringify(headers));
    }
  });
}

exports.getData = getDataWithoutCache;
exports.fetchData = fetch.fetchNew;
exports.dailyCatchup = fetch.dailyCatchup;
exports.getCharLosses = getZbkLossesForCharacter;
exports.getLatestKills = getLatestKills;
exports.getLatestLosses = getLatestLosses;
exports.getToppKillList = getToppKillList;
exports.getLoss = getLoss;
exports.getUnhandledSrpRequests = getUnhandledSrpRequests;
exports.getTypeName = getTypeName;
