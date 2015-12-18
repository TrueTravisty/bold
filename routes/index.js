var express = require('express');
var router = express.Router();
var fs = require('fs');
var path = require('path');
var http = require('https');
var imgcache = require('./../lib/imagecache');
var Slideshow = require('../model/index_slideshow');
var flash = require('connect-flash');
var passport = require('passport');
var zkb = require('./../lib/zkbApi');
var reddit = require('../lib/reddit');
var slack = require('../lib/slackApi');



/* GET home page. */
router.get('/', function(req, res) {
  var tmpl = req.can('seecorppage') ? 'index-member' : 'index';
  res.render(tmpl, {
            title: 'Home',
            current: 'home'
  });
});

router.get('/frontslides.json', function(req,res) {
    Slideshow.find({}, function(err, photos) {
        var slides = [];
        var path = '/images/slideshow/';
        for (var i = 0; i < photos.length; i++)
            slides.push({image: path + photos[i].path, text: photos[i].caption});
        res.json(slides);
    });
})

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



router.get('/submitsrp', requireCorp, function(req, res, next) {
  res.render('submitsrp', {
    title: 'SRP',
    current: 'srp'
  });
});

router.param('days', function(req, res, next, days) {
  req.days = days;
  next();
});

router.get('/terms', function(req, res, next) {
  res.render('terms');
});

router.get('/privacy', function(req, res, next) {
  res.render('privacy');
});

router.get('/instructions', function(req,res,next) {
  res.render('instructions');
});

router.get('/corpkills/:count', requireCorp, function(req, res, next) {
  zkb.getLatestKills(req.count, function(err, killmails) {
    if (err) return next(err);
    res.json(killmails);
  });
});

router.param('days', function(req, res, next, days) {
  req.days = days;
  next();
});

router.param('count', function(req, res, next, count) {
  req.count = count;
  next();
})

router.param('kmid', function(req, res, next, id) {
  req.kmid = id;
  next();
});

router.param('page', function(req, res, next, page) {
  req.page = page;
  next();
})

router.get('/srpstatus/:kmid',requireCorp, function(req, res, next) {
  var km = req.kmid;
  zkb.getLoss(km, function (err, loss) {
    if (err) next(err);
    var data = {srpinfo : null};
    if (loss) {
      data.srpinfo = {
        requested: loss.requested,
        denied: loss.denied,
        paid: loss.paid
      }
    };
    return res.json(data);
  });
});

router.get('/corpkills/top/:days/:count',requireCorp, function(req, res, next) {
  zkb.getToppKillList(req.count, req.days, true, function(err, killmails){
    if(err) return next(err);
    res.json(killmails);
  });
});

router.get('/charloss/:count/:page', requireCorp, function(req, res, next) {
  if (!req.user.characterID) return res.end('');
  var count = req.count;
  var page = req.page;
  zkb.getCharLosses(req.user.characterID, count, count*(page-1),function(err, killmails) {
    if (err) return next(err);
    var tmpl = page == 1 ? 'killmaillist' : 'killmailrows';
    res.json(killmails);    
  });
});

router.get('/corplosses/top/:days/:count', requireCorp, function(req, res, next) {
  zkb.getToppKillList(req.count, req.days, false, function(err, killmails){
    if(err) return next(err);
    res.json(killmails);
  });
});

router.get('/killmail/:kmid', requireCorp, function(req, res, next) {
  zkb.getKillMail(req.kmid, function(err, killmail) {
    if(err) return next(err);
    res.json(killmail);
  })
});

router.get('/corplosses/:count', requireCorp, function(req, res, next) {
  zkb.getLatestLosses(req.count, function(err, killmails) {
    if (err) return next(err);
    res.json(killmails);
  });
});

router.get('/redditnews', requireCorp, function(req, res, next) {
  var settings = req.app.get("settings").settings;
  reddit.getThreads(settings, 10, function(err, threads) {
    if (err) return next(err);
    res.json(threads);
  });
});

router.get('/fireside201504', requireCorp, function(req,res,next) {
  var filePath = path.join (__dirname, '..','files','fireside201504.mp3');
  var stat = fs.statSync(filePath);

  res.writeHead(200, {
    'Content-Type': 'audio/mpeg',
    'Content-Length': stat.size
  });

  var readStream = fs.createReadStream(filePath);
  readStream.pipe(res);
});

router.get('/slack', requireCorp, function(req,res,next) {
  res.render('joinslack');
});

router.get('/slackinfo.json', requireCorp, function(req,res,next) {
  var settings = req.app.get("settings").settings;
  slack.getMemberList(settings, function(err, members) {
    var user = req.user.username;
    if (err) return next(err);  
    var active = members.filter(function(item, index, array) {return !item.deleted});
    var disabled = members.filter(function(item, index, array) {return item.deleted});
    var slackStatus = "unregistered";
    var member;
    for (var i = 0; i < active.length; i++) {
        if (user == active[i].profile.real_name_normalized){
            slackStatus = "active";
            member = active[i];
            break;
        }
    }
    if (!member) {
        for (var i = 0; i < disabled.length; i++) {
            if (user == disabled[i].profile.real_name_normalized){
                slackStatus = "disabled";
                member = disabled[i];
                break;
            }
        }
    }
    return res.json({status:slackStatus, member:member});
  });  
})

router.post('/slack', requireCorp, function(req, res, next) {
  var settings = req.app.get("settings").settings;
  var member = {
    email: req.body.email,
    name: res.locals.username
  }
  slack.inviteMember(settings, member, function(err, result) {
    if (err) return res.end("ERROR");
    else return res.end(result);
  })
});

function requireCorp(req, res, next) {
  if (!req.isAuthenticated()) {
    req.session.loginredirect = req.originalUrl;
    return res.redirect('/login');
  }
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
