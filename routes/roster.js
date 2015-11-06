var express = require('express');
var router = express.Router();
var seat = require('./../lib/seatdb');

router.get('/roster', function(req, res, next) {
	if (!req.isAuthenticated() || !req.can('roster')) {
    	var err = new Error("Not authorized!");
    	err.status = 401;
    	return next(err);
  	}
	
	var settings = req.app.get("settings").settings;
	var corpId = settings['corp-id'];
	
	seat.getMembers(corpId, function(err, members) {
		if (err) return next(err);
		
		res.render('roster',
			{ members: members }		
		);
	});
	
});

module.exports = router;
