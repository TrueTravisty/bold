var express = require('express');
var router = express.Router();
var fs = require('fs');
var path = require('path');
var http = require('https');
var imgcache = require('./../lib/imagecache');
var Slideshow = require('../model/index_slideshow');
var flash = require('connect-flash');
var passport = require('passport');
var srp = require('./srp');
var zkb = require('./../lib/zkbApi');



/* GET home page. */
router.get('/', function(req, res) {
  if (req.can('seecorppage')) {
    res.render('index-member');
  }
  else {
    Slideshow.find({}, function(err, photos) {
      ;
        res.render('index', {
          title: 'Home',
          current: 'home',
          photos: photos
           });
    });
  }
});

router.get('/buyback', function(req, res) {
  res.render('buyback', {
    title: 'Buyback program',
    current: 'buyback',
  });
});


router.get('/info/newtobold', function(req, res) {
  res.render('newtocorp', {
    title: 'New to corp',
    current: 'info_newtobold',
  });
});



router.param('eve_id', function (req, res, next, id) {
  if (parseInt(id).toString() == id) {
    req.eve_id = id;
    next(null);
  } else {
    next(new Error('ID is not a number'));
  }

});

router.get('/eveimages/:eve_id', function(req, res){
  imgcache(req.eve_id, res);
});

router.get('/team', function(req, res) {
  var managersFile = path.join(__dirname, '..', 'model', 'managers.json');

  fs.exists(managersFile, function(exists) {
    if (exists) {
      fs.readFile(managersFile, 'utf8', function(err, data) {
        if (err) throw err;
        var dataa = data.toString();
        var managers = JSON.parse(dataa || '[]');
        managers.sort(compareManagers);
        res.render('structure.jade', {
          title: 'The Team',
          current: 'team',
          managers: managers
        });
      });
    } else {
      res.statusCode = 500;
      res.end("Missing managers.json file");
    }
  });
});

router.get('/submitsrp', srp.validateSrp, function(req, res, next) {
  res.render('submitsrp', {
    title: 'SRP',
    current: 'srp'
  });
});

router.get('/terms', function(req, res, next) {
  res.render('terms');
});

router.get('/privacy', function(req, res, next) {
  res.render('privacy');
});

router.get('/corpkills', requireCorp, function(req, res, next) {
  zkb.getLatestKills(25, function(err, lossmails) {
    if (err) return next(err);
    res.render('includes/killmaillist', {
      killmails: lossmails
    });
  });
});

router.get('/corplosses', requireCorp, function(req, res, next) {
  zkb.getLatestLosses(25, function(err, lossmails) {
    if (err) return next(err);
    res.render('includes/killmaillist', {
      killmails: lossmails
    });
  });

});

router.get('/redditnews', requireCorp, function(req, res, next) {
  res.render('includes/latestreddit');
});


function requireCorp(req, res, next) {
  if (!req.can('seecorppage')) {
    var err = new Error("This page is only for members of corp");
    err.status=403;
    return next(err);
  }
  next();
}

function compareManagers(a, b) {
  var cmp =  a.title.localeCompare(b.title);
  if (!cmp)
    cmp = a.name.localeCompare(b.name);
  return cmp;
}

module.exports = router;
