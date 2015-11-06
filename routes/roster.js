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
  res.locals.mainpages.push({
        path: '/roster',
        name: 'roster',
        displayname: 'Roster'
      })
  return next();
});

router.get('/', function(req, res, next) {
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
