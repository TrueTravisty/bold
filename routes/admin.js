var express = require('express');
var router = express.Router();
var User = require('../model/User');
var passport = require('passport');
var slideshow = require('./slideshow');
var permissions = require('../model/permissions.json');
var zkb = require('./../lib/zkbApi');
var Insurance = require('../model/Insurance');
var slack = require('../lib/slackApi');

var roles = [];
var unique = {};
for (perm in permissions) {
  permissions[perm].forEach(function(role){
    if (!unique[role]) {
      roles.push(role);
      unique[role] = true;
    }
  })
}


router.use(function(req,res,next) {
  if (!req.isAuthenticated() || !req.can('administrate')) {
    var err = new Error("Not authorized!");
    err.status = 401;
    return next(err);
  }
  return next();
});

router.get('/', function(req,res) {
  var data = getCapabilities(req);
  data.current = 'admin'
  res.render('admin/admin.jade', data );
});

function getCapabilities(req) {
  return {
    canusers: req.can('manageusers'),
    canupdate: req.can('updatesite'),
    canroles: req.can('manageroles'),
    cansrp:     req.can('managesrp')
  }
}

router.get('/users', requireRole('manageusers'), function(req,res) {
  User.find({}, function(err, users){
    if (err) {
      return next(err);
    }
    else if (!users) {
      return next(new Error('failed to load users'));
    }
    var data = getCapabilities(req);
    data.current = 'users';
    data.users = users;
    res.render('admin/users.jade', data);
  });
});

router.post('/togglerole', requireRole('manageroles'), function(req,res,next) {
  User.findOne({username: req.body.user}).select('username roles').exec(function(err, user){
    if (err) return next(err);
    if (!user) {
      var err = "User not found";
      err.status = 404;
      return next(err);
    }
    var roles = user.roles;
    var role = req.body.role;
    var ind = roles.indexOf(role);
    var result = '';
    if (ind < 0) {
      roles.push(role);
      result = 'hasrole';
    } else {
      roles.splice(ind, 1);
      result = 'missingrole';
    }
    user.roles = roles;
    user.save(function(err) {
      if (err) return next(err);
      return res.end(result);
    });
  })

});

function requireRole(role) {
  return function(req, res, next) {
    if (!req.can(role)) {
      var err = new Error('No permission');
      err.status = 401;
      return next(err);
    }
    return next();
  }
}

router.get('/roles', requireRole('manageroles'), function(req,res,next) {
  User.find({}).select('username roles').sort('username').exec(function(err, users) {
    available_roles = req.getRoles();
    res.render('admin/roles', {
      users: users,
      available_roles: available_roles
    });
  });

});

router.param('user', function(req, res, next, id){
  User.find({username:id}, function(err, user){
    if (err) {
      return next(err);
    }
    else if (!user) {
      return next(new Error('failed to load user'));
    }

    req.ruser = user[0];
    if (!req.ruser.displayname)
      req.ruser.displayname="";
    if (!req.ruser.email)
      req.ruser.email="";
    next();
  });
});

router.get('/users/:user', requireRole('manageusers'), function(req,res, next) {
   if (req.param('delete', 'no') == 'yes' && req.can('deleteuser')){
     if (req.ruser.username != "superadmin"){
       return User.remove({ username: req.ruser.username}, function(err){
         if (err) next(err);
         res.redirect(".");
       });
     }
   }
   ;
   res.render('admin/user', {
     edituser:req.ruser,
     roles:roles,
     canroles:req.can('manageroles'),
     message:''
   })
});

router.post('/users/:user', requireRole('manageusers'), function(req,res,next) {

});

router.param('setting', function(req, res, next, setting){
  var Settings = req.app.get("settings");
  if (!Settings.permissions[setting]){
    var err = new Error("Unknown setting");
    err.status=404;
    return next(err);
  }
  if (!req.can(Settings.permissions[setting])){
    var err = new Error("Not authorised");
    err.status=401;
    return next(err);
  }
  req.settingName = setting;
  next();
});

router.get('/settings', function(req,res){
  var s = [];
  ;
  var Settings = req.app.get("settings");
  for (setting in Settings.permissions) {
    if (req.can(Settings.permissions[setting])) {
      s.push({name: setting, value: Settings.settings[setting]});
    }
  }
  res.render('admin/settings.jade', {
    settings: s
  });
});

router.get('/settings/:setting', function(req,res,next){
  var setting = req.settingName;
  var Settings = req.app.get("settings");
  res.end(Settings.settings[setting]);
});

router.get('/slack', function(req,res,next) {
  var settings = req.app.get("settings").settings;
  ;
  slack.getMemberList(settings, function(err, members) {
    var active = members.filter(function(item, index, array) {return !item.deleted});
    var disabled = members.filter(function(item, index, array) {return item.deleted});
    if (err) return next(err);
    res.render('admin/slack', {members: active, disabled: disabled});
  });
});

router.get('/srp/shiplist', requireRole('managesrp'), function(req, res, next) {
  zkb.getUnhandledSrpRequest(function(err, result) {
    if (err) res.end("Failed");
    var ships = {};

  });
});

router.get('/srp/pilotlist', requireRole('managesrp'), function(req, res, next) {
  zkb.getUnhandledSrpRequests(function(err, result) {
    if (err) res.end("Failed");
    var pilots = {};
    for (var i = 0, l = result.length; i < l; ++i) {
      var loss = result[i];
      var userId = loss.user;
      var pilot;
      if (pilots[userId]) {
        pilot = pilots[userId];
      } else {
        pilot = {
          name: loss.killmail.victim.characterName,
          id: userId,
          requests: 0,
          losses: 0,
          payout: 0,
          losslist: []
        };
        pilots[userId] = pilot;
      }
      pilot.losslist.push(loss);
      pilot.requests = pilot.requests + 1;
      pilot.losses = pilot.losses + loss.value;
    }
    res.render('includes/srpunapproved', {
      users: pilots
    })
  });

});

router.get('/srp/insurance', requireRole('managesrp'), function(req, res, next) {
  res.render('admin/insurance', {
    insurancelist: [ {shipid: 621, shipname: "Scythe Fleet Issue", insurance: 3924} ]
  })
});

router.get('/srp/insurance/all', requireRole('managesrp'), function(req, res, next) {
  Insurance.find({}).populate('setBy').exec(function(err, dbresult) {
    if (err) {
      return res.status(500).end();
    }

    zkb.getUnhandledSrpRequests(function(err, requests){
      if (err) return res.end(JSON.stringify(result));

      var registeredShips = {};
      var unregisteredShips = {};

      var result = [];
      // populate simple list of registered ships
      for (var i = 0, l = dbresult.length; i < l; ++i) {
        registeredShips[dbresult[i].shipid] = 1;

        // populate results
        result.push({
          shipid: dbresult[i].shipid,
          insurance: dbresult[i].insurance,
          shipname: dbresult[i].shipname,
          setBy: dbresult[i].setBy.username,
          setAt: dbresult[i].setAt
        });
      }

      // extend results with unique registered ships
      for (var j = 0, ll = requests.length; j < ll; ++j) {
        var victim = requests[j].victim;
        var shipTypeID = victim.shipTypeID;
        if (!registeredShips[shipTypeID] && !unregisteredShips[shipTypeID]){
          unregisteredShips[shipTypeID] = 1;
          result.push({
            shipid: shipTypeID,
            shipname: victim.shipType
          });
        }
      }

      // return results
      res.type('json');
      res.end(JSON.stringify(result));
    })



  });
});

router.param('ship', function(req, res, next, id) {
  Insurance.findOne({shipid:id}).populate('setBy').exec(function(err, ship){
    if(err) return next(err);
    if (ship) {
      req.ship = ship;
      return next();
    } else {
      zkb.getTypeName(id, function(err, typeName) {
        if (err) return next (err);
        req.ship = {
          shipid: id,
          shipname: typeName
        }
        return next();
      });
    }
  })
});

function returnInsuranceJson(ship, res) {
  var result = {
    shipid: ship.shipid,
    shipname: ship.shipname,
    insurance: ship.insurance,
    srpFactor: ship.srpFactor,
    setAt: ship.setAt,
    setBy: ship.setBy.username
  }
  res.type('json');
  res.end(JSON.stringify(result));
}

router.get('/srp/insurance/:ship', requireRole('managesrp'), function(req, res, next) {
  returnInsuranceJson(req.ship, res);
});

router.post('/srp/insurance/:ship', requireRole('managesrp'), function(req, res, next) {
  var ship = req.ship;
  var indb = "setAt" in ship;
  var sendtInsurance = Number(req.body.insurance);
  var sendtSrpFactor = Number(req.body.srpFactor);
  if (sendtInsurance != ship.insurance || sendtSrpFactor != ship.srpFactor) {
    ship.insurance = sendtInsurance;
    ship.srpFactor = sendtSrpFactor;
    ship.setAt = new Date();
    ship.setBy = req.user._id;
    var cb = new function(err) {
      if (err) return next(err);
      return res.end("OK");
    }
    if (!indb) {
      Insurance.create(ship, cb);
    } else {
      ship.save(cb);
    }
  } else {
    return res.end("Unchanged");
  }
}, function(err, req, res, next) {
  res.end("ERROR: " + JSON.stringify(err));
});

router.post('/settings/:setting', function(req,res,next){
  var Settings = req.app.get("settings");
  var setting = req.settingName;
  if (req.body.value !== Settings.settings[setting]){
    Settings.set(setting, req.body.value, req.user, function(error) {
      if (error) res.end("Failed");
      res.end("OK");
    });
  } else {
    res.end("Unchanged");
  }
});

router.get('/srp', requireRole('managesrp'), function(req, res, next) {
  res.render('admin/srpang.jade');
});

/* Other routes mapped to admin */
router.use(slideshow);


module.exports = router;
