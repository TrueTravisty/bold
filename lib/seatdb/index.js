var mysql = require('mysql');

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
	
	if (!pool) return callback("No pool...");
	
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


exports.getMembers = getMembers;
