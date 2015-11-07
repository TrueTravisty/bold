var express = require('express');
var router = express.Router();
var seat = require('./../lib/seatdb');

router.use(function(req,res,next) {
  if (!req.isAuthenticated()) {
    req.session.loginredirect = req.originalUrl;
    return res.redirect('/login');
  }
  if (!req.can('roster') || !req.can('seecorppage')) {
    var err = new Error("Not authorized!");
    err.status = 401;
    return next(err);
  }
  
  return next();
});

router.get('/', function(req, res, next) {
	var settings = req.app.get("settings").settings;
	var corpId = settings['corp-id'];
	
	seat.getMembers(corpId, function(err, members) {
		if (err) return next(err);
		
		res.render('roster',
			{ members: members, current: 'roster' }		
		);
	});
	
});

router.param('member', function(req, res, next, id) {
   seat.getCharacterInfo(id, function(err, character) {
       if (err) return next(err);
       req.member = character;
       return next();
   });
   
});

router.get('/:member', function(req, res, next) {
   res.render('rostertoon', {
       current: 'roster',
       member: req.member
   });
});

module.exports = router;
