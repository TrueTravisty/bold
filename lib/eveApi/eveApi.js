apiCache = require('./EveXmlApiCache.js');

characterInfo = require('./characterInfo.js')

function verifyResult(result) {
  var output = {};
  if (!result) {
    output.error = new Error('No result from EveAPI');
    return output;
  }
  if (result.eveapi.error) {
    output.error = new Error(result.eveapi.error);
    return output;
  }
  var apiResult = result.eveapi.result;
  if (!apiResult)
  {
    output.error = new Error('No result from EveAPI');
    return output;
  }
  output.result = apiResult;
  return output;
}

function verifiedEveCall(path, query, key, code, callback) {
  apiCache.eveApi(path, query, key, code, function(err, result) {
    if (err) return callback(err);
    var r = verifyResult(result);
    if (r.error) return callback(r.error);
    return callback(null, r);
  })
}

function getPublicCharacterInfo(charId, callback) {
  verifiedEveCall('eve/CharacterInfo.xml.aspx', {characterID:charId}, null, null, function(err, result) {
    if(err) return callback(err);
    var character = characterInfo.first(result.result);

    callback(null, character);

  });
};

function getCorpId(charId, callback) {
  getPublicCharacterInfo(charId, function(err, character) {
    if (err) return callback(err);
    callback(null, character.corporationID);
  });
}

function getApiAccessMask(api, code, callback) {
  verifiedEveCall('account/APIKeyInfo.xml.aspx', {}, api, code, function(err, result){
    if (err) return callback(err);
    ;
    accessMask = result.result[0].key[0].$.accessMask;
    return callback(null, accessMask);

  });
}

function validateApi(req, res, next) {
  /*if (!req.isAuthenticated()) {
    var err = new Error("Not logged in!");
    err.status = 401;
    return next(err);
  }*/

  if (!req.body.apiKey || !req.body.apiVerification) {
    var err = new Error("Missing apiKey or apiVerification");
    err.status = 400;
    return next(err);
  }

  getApiAccessMask(req.body.apiKey, req.body.apiVerification, function(err, result) {
    if (err) {
      res.status = 450;
      return res.end('ERROR');
    }
    return res.end('OK');
  });

}


exports.getPublicCharacterInfo = getPublicCharacterInfo;
exports.validate = function() {
  return validateApi;
}
exports.getCorpId = getCorpId;
exports.cacheModel = apiCache.model;
