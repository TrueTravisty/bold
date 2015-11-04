var mysql = require('mysql');

// var pool = mysql.createPool({
// 	connectionLimit : 100,
// 	host : process.env.DBHOST,
// 	user : process.env.DBUSER,
// 	password : process.env.DBPW,
// 	database : 'seat',
// 	debug : false
// });

console.log(process.env.TESTVAR || 'no test');