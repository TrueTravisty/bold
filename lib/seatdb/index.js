var mysql = require('mysql');
var eveApi = require('../eveApi');

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

function getMembers(corpId, callback) {
    if (!pool) callback ("Missing SeAT DB");
	pool.getConnection(function(err, connection) {
		if (err) {
			return callback("Connection error: " + err);
		}
		
		connection.query("select cmt.characterID, cmt.name, cmt.startDateTime, cmt.title, cmt.logonDateTime, cmt.logoffDateTime, cmt.location, cmt.shipType, k.keyID, k.isOk " 
						+ "from seat.corporation_member_tracking as cmt " 
						+ "left join seat.account_apikeyinfo_characters " 
						+ "on cmt.characterID = account_apikeyinfo_characters.characterID "
						+ "left join seat.seat_keys as k "
						+ "on account_apikeyinfo_characters.keyID = k.keyID "
						+ "left join seat.account_apikeyinfo as ap "
						+ " on k.keyID = ap.keyID "
						+ "where cmt.corporationID = " + corpId, function(err, rows) {
			connection.release();
			return callback(err, rows);
		});
	});
}

function getCharacterInfo(id, callback) {
    if (!pool) callback ("Missing SeAT DB");
    pool.getConnection(function(err, connection) {
		if (err) {
			return callback("Connection error: " + err);
		}
		
        var query = "select s.characterID, s.name, s.corporationID, s.corporationName, k.isOk "
                    + " from seat.character_charactersheet as s"
                    + " join seat.account_apikeyinfo_characters"
                    + " on s.characterID = account_apikeyinfo_characters.characterID"
                    + " JOIN seat.seat_keys as k"
                    + " on account_apikeyinfo_characters.keyID = k.keyID"
                    + " where s.characterID = " + id + " limit 1;"
                   
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
       if (err) return callback(err);
       
       pool.getConnection(function(err, connection) {
          if (err) return callback(err);
          
          connection.query("SELECT keyID FROM seat.account_apikeyinfo_characters where characterID=" + character.characterID, function (err, rows) {
              connection.release();
              if (err) return callback (err);
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
       if (err) return callback(err);
       if (!character.keys || character.keys.length == 0) return callback(null, character);
       
       pool.getConnection(function(err, connection) {
          if (err) return callback(err);     
          var query =      "SELECT DISTINCT characterID, characterName, corporationID, corporationName"
                           + " FROM seat.account_apikeyinfo_characters where keyID in" 
                           + " (SELECT keyID FROM seat.seat_people "
                           + " WHERE personID in "
                           + "(SELECT DISTINCT personID FROM seat.seat_people as p2 where keyID in ("
                           + character.keys.join()
                           + ")))";
          
          connection.query(query, function (err, rows) {
              connection.release();
              if (err) return callback (err);
              character.alts = rows;
              return callback(null, character);
          });
                     
       });        
    });
}

function getCharacterInfoAddMain(id, callback) {
    if (!pool) callback ("Missing SeAT DB");
    getCharacterInfoAddPeople(id, function(err, character){        
       if (err)  {
           console.log(err);
           return callback(err);  
       } 
       if (!character.keys || character.keys.length == 0) return callback(null, character);
       pool.getConnection(function(err, connection) {
          if (err) return callback(err);
          var query =   "select DISTINCT pm.*"
                        +" from seat.seat_people as p"
                        +" join seat.seat_people_main as pm"
                        +" on pm.personID = p.personID"
                        +" where keyID in (" + character.keys.join() + ")";
         
         connection.query(query, function(err, rows) {
             if (err) return callback(err);
             if (rows.length > 0) character.main = rows[0];
             return callback(null, character);
         })
       });
    });
}



exports.getMembers = getMembers;
exports.getCharacterInfo = getCharacterInfoAddMain;
