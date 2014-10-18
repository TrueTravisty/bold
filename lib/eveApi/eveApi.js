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

function getPublicCharacterInfo(charId, callback) {
  apiCache.eveApi('eve/CharacterInfo.xml.aspx', {characterID:charId}, function(err, result) {
    if(err) return callback(err);
    var r = verifyResult(result);
    if (r.error) return callback(r.error);
    character = characterInfo.first(r.result);

    callback(null, character);

  });
};

exports.getPublicCharacterInfo = getPublicCharacterInfo;
