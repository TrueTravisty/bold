var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
var url = require('url');
var querystring = require('querystring');
var https = require('https');
var xml2js = require('xml2js');

var ApiCache = new Schema({
  path: String,
  query: String,
  key: Number,
  result: String,
  cached_until: {type: Date, expires: '1s'}
});

ApiCacheModel = mongoose.model('ApiCache', ApiCache);

function eveApi(path, query, apiId, apiVerify, callback) {
  if (path.substr(0,1) != '/')
    path = '/' + path;
  if (apiId && isFunction(apiId) && !apiVerify && !callback) {
    return eveApi(path, query, null, null, apiId);
  }

  var cacheQueryString = querystring.stringify(query);

  ApiCacheModel.find({
    path: path,
    query: cacheQueryString,
    key: apiId,
  }, function(err, result) {
    if (err) return callback(err);
    if (result.length > 0) {
      cachedResult = JSON.parse(result[0].result);
      cachedResult.fromLocalCache = true;
      return callback(null, cachedResult);
    }
    callApi(path, query, apiId, apiVerify, function(err, result) {
      if (result.substr(0,5) !== "<?xml") {
        var err = new Error("Unrecognized results from API call");
        return callback(err);
      }
      xml2js.parseString(result, function(err, result) {
        if (err) return callback(err);
        var cached = new ApiCacheModel();
        cached.path = path;
        cached.query = cacheQueryString;
        cached.key = apiId;
        cached.result = JSON.stringify(result);
        cached.cached_until = getCacheTime(result);
        cached.save();
        result.fromLocalCache = false;

        callback(null, result);
      });
    });
  });
}

function getCacheTime(result) {
  var curTimeStr = result.eveapi.currentTime;
  var cacheTimeStr = result.eveapi.cachedUntil;
  var curTime = Date.parse(curTimeStr);
  var diff = Date.now() - curTime;
  var cacheTimeMs = Date.parse(cacheTimeStr) + diff;
  var cacheTime = new Date();
  cacheTime.setTime(cacheTimeMs);
  return cacheTime;
}

function callApi(path, query, apiId, apiVerify, icallback) {
  var apiUrl = url.parse("https://api.eveonline.com/");
  apiUrl.pathname = path;
  if (apiId != null && apiVerify != null) {
    query.keyID = apiId;
    query.vCode = apiVerify;
  }
  apiUrl.query = query;
  urlString = url.format(apiUrl);
  console.log(urlString);



  var get_options = {
    hostname: 'api.eveonline.com',
    path: path + '?' + querystring.stringify(query),
    headers: {
      'User-Agent': 'BO-LD Website [in game: Yaldo Asanari]'
    }
  };
  console.log(get_options);

  https.get(get_options, function(res) {
    var result = "";
    res.on('data', function(chunk) {
      result += chunk;
    });
    res.on('end', function(chunk) {
      icallback(null, result);
    });
  }).on('error', function(error) {
    icallback(error);
  });
}

module.exports.eveApi = eveApi;


function isFunction(functionToCheck) {
 var getType = {};
 return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
}
