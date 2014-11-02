var express = require('express');
var router = express.Router();
var User = require('../model/User');
var eveApi = require('../lib/eveApi');
var zkbApi = require('../lib/zkbApi');

router.use(validateSrp);

function validateSrp(req, res, next) {
  if (!req.isAuthenticated()) {
    req.session.loginredirect = req.originalUrl;
    return res.redirect('/login');
  } else {
    if (!req.can('submitsrp')) {
      var err = new Error('SRP only available for corp members');
      err.status = 401;
      return next(err);
    }
  }
  next();
}

router.validateSrp = validateSrp;


router.get('/losses', function(req, res, next) {
  zkbApi.getZbkLossesForCharacter(req.user.characterID, 50, function(err, losses) {
    if (err) return next(err);
    res.render('includes/losslist', {
      losses:losses
    });
  });
});



module.exports = router;
