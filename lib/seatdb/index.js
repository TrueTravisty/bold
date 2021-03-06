var mysql = require('mysql');
var eveApi = require('../eveApi');

var seatUrl = "";
var seatToken = "";

var pool = null; 
if (process.env.SEATDBHOST)
{
	pool = mysql.createPool({
		connectionLimit : 100,
		host : process.env.SEATDBHOST,
		user : process.env.SEATDBUSER,
		password : process.env.SEATDBPW,
		database : 'seat',
		debug : false
	});
	
	pool.on('enqueue', function () {
		console.log('Waiting for available connection slot');
	});
}

function setApiInfo(url, token) {
    seatUrl = url;
    seatToken = token;
}

function getMembers(corpId, callback) {
    if (!pool) callback ("Missing SeAT DB");
	pool.getConnection(function(err, connection) {
		if (err) {
			return callback("Connection error: " + err);
		}
		
        var query = "select cmt.characterID, cmt.name, cmt.startDateTime, cmt.title, cmt.logonDateTime, cmt.logoffDateTime, cmt.location, cmt.shipType, k.key_id as keyID, k.enabled as isOk, " + 
		            "(select count(characterID) from seat.bold_roster_comment as brc where brc.characterID = cmt.characterID and brc.deleted <> 1) as comments, bae.reason as exempt  " +
		            "from seat.corporation_member_trackings as cmt  " +
		            "left join seat.account_api_key_info_characters  " +
		            "on cmt.characterID = account_api_key_info_characters.characterID " + 
		            "left join seat.eve_api_keys as k  " +
		            "on account_api_key_info_characters.keyID = k.key_id " + 
		            "left join seat.account_api_key_infos as ap " +  
		            "on k.key_id = ap.keyID  " +
		            "left join seat.bold_api_exempt as bae " +
		            "on cmt.characterID = bae.characterID  " +
		            "where cmt.corporationID = " + connection.escape(corpId);
                        
        connection.query(query, function(err, rows) {
			connection.release();
            var members = {};
            for (var i = 0, l = rows.length; i < l; ++i) {
                var row = rows[i];
                var id = row.characterID;
                if (members[id])
                    members[id].isOk = members[id].isOk || row.isOk;
                else
                    members[id] = row;
            }
			return callback(err, members);
		});
	});
}

function getCharacterInfo(id, callback) {
    if (!pool) callback ("Missing SeAT DB");
    pool.getConnection(function(err, connection) {
		if (err) {
			return callback("Connection error: " + err);
		}
		
        var query = "select s.characterID, s.name, s.corporationID, s.corporationName, k.enabled as isOk " +  
                    "from seat.character_character_sheets as s  " +
                    "join seat.account_api_key_info_characters  " +
                    "on s.characterID = account_api_key_info_characters.characterID  " +
                    "JOIN seat.eve_api_keys as k  " +
                    "on account_api_key_info_characters.keyID = k.key_id  " +
                    "where s.characterID = " + connection.escape(id) + " limit 1;"
                   
        connection.query(query, function(err, rows) {
			connection.release();
            if (err) return callback (err);
            if (rows.length >= 1) 
                return callback(null, rows[0]);
            
            // found nothing - use Eve API and find a public API
            eveApi.getPublicCharacterInfo(id, function(err, character) {
                return callback(err, character);
            })
		});
	});
}

function getCharacterInfoAddKeys(id, callback) {
    if (!pool) callback ("Missing SeAT DB");
    getCharacterInfo(id, function(err, character) {
       if (err || !character) return callback(null, character);
       
       pool.getConnection(function(err, connection) {
          if (err) return callback(null, character);
          
          connection.query("SELECT keyID FROM seat.account_api_key_info_characters where characterID=" + connection.escape(character.characterID), function (err, rows) {
              connection.release();
              if (err) return callback (null, character);
              var keys = [];
              for (var i = 0; i < rows.length; ++i){
                  keys.push(rows[i]['keyID']);
              }
              character.keys = keys;
              return callback(null, character);
          });
                     
       });        
    });
}

function getCharacterInfoAddPeople(id, callback) {
    if (!pool) callback ("Missing SeAT DB");
    getCharacterInfoAddKeys(id, function(err, character) {
       if (err || !character) return callback(null, character);
       if (!character.keys || character.keys.length == 0) return callback(null, character);
       
       pool.getConnection(function(err, connection) {
          if (err) return callback(null, character);     
          var query =      "SELECT DISTINCT characterID, characterName, corporationID, corporationName " +
                           "FROM seat.account_api_key_info_characters where keyID in " +
                           "(SELECT key_id FROM seat.person_members  " +
                           "WHERE person_id in " +
                           "(SELECT DISTINCT person_id FROM seat.person_members as p2 where key_id in (" 
                           + character.keys.join()
                           + ")))";
          
          connection.query(query, function (err, rows) {
              connection.release();
              if (err) return callback (null, character);
              character.alts = rows;
              return callback(null, character);
          });
                     
       });        
    });
}

function getCharacterInfoAddMain(id, callback) {
    if (!pool) callback ("Missing SeAT DB");
    getCharacterInfoAddPeople(id, function(err, character){        
       if (err || !character)   {
           console.log(err);
           return callback(null, character);  
       } 
       if (!character.keys || character.keys.length == 0) return callback(null, character);
       pool.getConnection(function(err, connection) {
          if (err) return callback(err);
          var query =   "select DISTINCT p.* " +
                        "from seat.person_members as pm " +
                        "join seat.people as p " +
                        "on pm.person_id = p.id " +
                        "where key_id in (" + character.keys.join() + ")";
         
         connection.query(query, function(err, rows) {
             connection.release();
             if (err) return callback(null, character);
             if (rows.length > 0) character.main = rows[0];
             return callback(null, character);
         })
       });
    });
}

function getCharacterInfoAddComments(id, callback) {
    if (!pool) callback ("Missing SeAT DB")
    getCharacterInfoAddMain(id, function(err, character) {
        if (err || !character) {
            console.log(err);
            return callback(null, character);
        }
        pool.getConnection(function(err, connection) {
            if (err) return callback(null, character);
            
            var query = "SELECT * FROM bold_roster_comment WHERE characterID=" + connection.escape(id)  + " ORDER BY updated_at DESC";
            connection.query(query, function(err, rows) {
                connection.release();
                if (err) { console.log(err); return callback(null, character);}
                character.comments=rows;
                return callback(null, character);
            });
        });
    });
}

function getCharacterComments(id, callback) {
    var query = function(connection) {return "SELECT * FROM bold_roster_comment WHERE characterID=" + connection.escape(id)  + " AND deleted=0 ORDER BY updated_at DESC"};
    runQueryAndReturnResult(query, callback);
}

function runQueryAndReturnResult(queryBuilder, callback) {
    //console.log(query);
    if (!pool) callback ("Missing SeAT DB")
    pool.getConnection(function(err, connection) {
        if (err) return callback("Could not connect");
        var query = queryBuilder(connection);
        
        connection.query(query, function(err, rows) {
            connection.release();
            return callback(err, rows);
        });
    });            
}

function addCharacterComment(characterId, userName, comment, callback) {
    var query = function(connection) {
        return "INSERT INTO bold_roster_comment (characterID, user, text) VALUES (" + connection.escape(characterId) + 
                    ", " + connection.escape(userName) + ", " + connection.escape(comment) + ")";
    }
    runQueryAndReturnResult(query, callback);
}

function updateCharacterComment(id, comment, callback) {
    var query = function(connection) {
        return "update bold_roster_comment SET text=" + connection.escape(comment) + " WHERE id=" + connection.escape(id);
    }
    runQueryAndReturnResult(query, callback);
}

function deleteCharacterComment(id, callback) {
    var query = function(connection) {
        return "update bold_roster_comment SET deleted=1 WHERE id=" + connection.escape(id);
    }
    runQueryAndReturnResult(query, callback);
}

function hasExemption(characterID, callback) {
    var query = function(connection) { 
        return "SELECT * from  `seat`.`bold_api_exempt` WHERE characterID=" + connection.escape(characterID);
    };
    runQueryAndReturnResult(query, callback);
}

function addExemption(characterID, reason, callback) {
    var query = function(connection) { return "INSERT INTO `seat`.`bold_api_exempt` (`characterID`, `reason`) VALUES ("
                                        + connection.escape(characterID) + ", "
                                        + connection.escape(reason) + ")";
        };
    runQueryAndReturnResult(query, callback);
}

function updateExemption(characterID, reason, callback) {
    var query = function(connection) {
        return "UPDATE `seat`.`bold_api_exempt` SET `reason` = " + connection.escape(reason)
               + "WHERE `characterID` = " + connection.escape(characterID);
    }
    runQueryAndReturnResult(query, callback);
}

function addOrUpdateExemption(characterID, reason, callback) {    
    hasExemption(characterID, function(err, exemption) {
        if (err) return callback(err);
        if (exemption.length > 0)
            return updateExemption(characterID, reason, callback);
        else
            return addExemption(characterID, reason, callback);
    })
}

function removeExemption(characterID, callback) {
    var query = function(connection) {
        return "DELETE FROM `seat`.`bold_api_exempt` WHERE characterID=" + connection.escape(characterID);
    }
    runQueryAndReturnResult(query, callback);
}

function getAllCharacterKeys(characterID, callback) {
    var query = function(connection) {
        return "SELECT DISTINCT aac.keyID, sk.enabled as isOk, sk.last_error as lastError, sp.person_id as personID " +
               "FROM seat.account_api_key_info_characters as aac " +
               "INNER JOIN seat.account_api_key_infos as aa ON aac.keyID = aa.keyID " +
               "LEFT JOIN seat.eve_api_keys as sk ON aac.keyID = sk.key_id " +
               "LEFT JOIN seat.person_members as sp on aac.keyID = sp.key_id " +
               "WHERE sp.person_id in ( " +
	               "SELECT _sp.person_id  "
	               "FROM seat.account_api_key_info_characters as _aac " + 
	               "INNER JOIN seat.account_api_key_infos as _aa ON _aac.keyID = _aa.keyID " +
	               "LEFT JOIN seat.person_members as _sp on _aac.keyID = _sp.key_id " + 
	               "WHERE _aac.characterID=" + connection.escape(characterID) + ") " +
               "AND (aa.type = \"Account\" OR aa.type = \"Character\")";        
    }
    runQueryAndReturnResult(query, callback);
}

function getAllShipInfo(callback) {
    var query = function(connection) {
        return "SELECT it.typeName, ig.groupName, ie.notes, ie.insurancePrice, ie.insurancePayout, ie.srpPercentage " + 
               "FROM seat.invTypes as it " +
               "LEFT JOIN seat.bold_insurance_estimate as ie on it.typeID = ie.typeID " +
               "LEFT JOIN seat.invGroups as ig on it.groupID = ig.groupID " +
               "WHERE ig.categoryID = 6 AND it.published = true;";
    }
    runQueryAndReturnResult(query, callback);
}

function getShipInfo(shipID, callback) {
    var query = function(connection) {
        return "SELECT it.typeName, ig.groupName, ie.notes, ie.insurancePrice, ie.insurancePayout, ie.srpPercentage " + 
               "FROM seat.invTypes as it " +
               "LEFT JOIN seat.bold_insurance_estimate as ie on it.typeID = ie.typeID " +
               "LEFT JOIN seat.invGroups as ig on it.groupID = ig.groupID " +
               "WHERE it.typeID = " + connection.escape(shipID) + ";";
    }
    runQueryAndReturnResult(query, callback);
}

function updateInsuranceInfo(shipID, notes, insurancePrice, insurancePayout, srpPercentage, callback) {
    var query = function(connection) {
        return "UPDATE seat.bold_insurance_estimate " + 
               "SET notes = " + connection.escape(notes) + ", " + 
                   "insurancePrice = " + connection.escape(insurancePrice) + ", " +
                   "insurancePayout = " + connection.escape(insurancePayout)  + ", " +
                   "srpPercentage = " + connection.escape(srpPercentage) + ", " + 
               "WHERE typeID = " + connection.escape(shipID);
    }
    
    runQueryAndReturnResult(query, callback);
}

exports.getMembers = getMembers;
exports.getCharacterInfo = getCharacterInfoAddMain;
exports.addCharacterComment = addCharacterComment;
exports.getCharacterComments = getCharacterComments;
exports.deleteCharacterComment = deleteCharacterComment;
exports.updateCharacterComment = updateCharacterComment;
exports.addExcemption = addOrUpdateExemption;
exports.hasExemption = hasExemption;
exports.getAllCharacterKeys = getAllCharacterKeys;
exports.getAllShipInfo = getAllShipInfo;
exports.getShipInfo = getShipInfo;
exports.updateInsuranceInfo = updateInsuranceInfo;
exports.setApiInfo = setApiInfo;
