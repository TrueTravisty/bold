var https = require('https');
var gunzip = require('zlib').createGunzip();
var apiCache = require('../eveApi').cacheModel;


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
      console.log (JSON.stringify(headers));
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

  console.log(JSON.stringify(options));

  https.get(options, function(res) {

    var body = '';

    res.pipe(gunzip);

    gunzip.on('data', function(data){
      body += data;
    });

    gunzip.on('end', function() {
      callback(null, res.headers, body);
    })
  }).on('error', function(err) {
    callback(err);
  });
}

exports.getData = getZkbDataFromCache;
