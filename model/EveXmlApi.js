var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
var url = require('url');
var querystring = require('querystring');
var https = require('https');
    
var ApiCache = new Schema({
  path: String,
  query: String,
  key: Number,
  result: String,
  cached_until: {type: Date, expires: '1s'}
});

ApiCacheModel = mongoose.model('ApiCache', ApiCache);

function callApi(path, query, apiId, apiVerify, callback) {
  if (apiId && isFunction(apiId) && !apiVerify && !callback) {
    return callApi(path, query, null, null, apiId);
  }
  
  var cacheQueryString = querystring.stringify(query);
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
  
  https.get(get_options, function(res) {
    var result = "";
    res.on('data', function(chunk) {
      result += chunck;
    });
    res.on('end', function(chunk) {
      callback(null, result);    
    });
  }).on('error', function(error) {
    callback(error);
  });
}

module.exports.callApi = callApi;


function isFunction(functionToCheck) {
 var getType = {};
 return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
}