var https = require('https');
var zlib = require('zlib');
var apiCache = require('../eveApi').cacheModel;
var fetch = require('./fetch');
var zkbKill = require('./model');
var dbInfo = require('./dbInfo');


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
      callback(null, res.headers, body);
    })
  }).on('error', function(err) {
    callback(err);
  });
}

function getZbkLossesForCharacter(characterId, maxCount, callback) {
  zkbKill.find({user: characterId, kill: false}).sort('-time').limit(maxCount).exec(function(err, result) {
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
  zkbKill.find({kill: true}).sort('-time').limit(maxCount).exec(function(err, result) {
    returnKills(err, result, callback);
  });
}

function getLatestLosses(maxCount, callback) {
  zkbKill.find({kill: false}).sort('-time').limit(maxCount).exec(function(err, result) {
    returnKills(err, result, callback);
  });
}

exports.getData = getZkbDataFromCache;
exports.fetchData = fetch.fetchNew;
exports.getZbkLossesForCharacter = getZbkLossesForCharacter;
exports.getLatestKills = getLatestKills;
exports.getLatestLosses = getLatestLosses;
