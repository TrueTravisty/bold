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
    if (ind < 0 && req.body.grant) {       
      roles.push(role);      
    } else if(ind >= 0 && !req.body.grant) {
      roles.splice(ind, 1);      
    }
    user.roles = roles;
    user.save(function(err) {
      if (err) return next(err);
      return res.json(roles);
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

router.get('/roles.json', requireRole('manageroles'), function(req,res,next) {
    available_roles = req.getRoles();
    res.json(available_roles);
});

router.param('role', function(req, res, next, role) {
    req.role = role;
    return next();
})

router.get('/usernames.json', function(req, res, next) {
  User.find({}).select('username').sort('username').exec(function(err, users) {
    var usernames = users.map(function(u){return u.username});
    res.json(usernames);    
  });
});

router.get('/roles/:role', requireRole('manageroles'), function(req, res, next) {
    User.find({}).select('username roles').sort('username').exec(function(err, users) {
        if (err) return next(err);
        var usersInRole = [];
        users.forEach(function(user) {
            if (user.roles.indexOf(req.role) >= 0) {
                usersInRole.push(user.username);
            }
        });
        res.json(usersInRole);
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
  res.render('admin/settings.jade');
});

router.get('/settings.json', function(req, res) {
  var s = [];
  
  var Settings = req.app.get("settings");
  for (var setting in Settings.permissions) {
    if (req.can(Settings.permissions[setting])) {
      s.push({name: setting, value: Settings.settings[setting]});
    }
  }
  res.json(s)
})

router.get('/settings/:setting', function(req,res,next){
  var setting = req.settingName;
  var Settings = req.app.get("settings");
  res.json(Settings.settings[setting]);
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

router.get('/slack', function(req,res,next) {
  var settings = req.app.get("settings").settings;
  ;
  slack.getMemberList(settings, function(err, members) {
    if (err) return next(err);  
    var active = members.filter(function(item, index, array) {return !item.deleted});
    var disabled = members.filter(function(item, index, array) {return item.deleted});    
    res.render('admin/slack', {members: active, disabled: disabled});
  });
});

router.get('/srp', requireRole('managesrp'), function(req, res, next) {
  res.render('admin/srpang.jade');
});

/* Other routes mapped to admin */
router.use(slideshow);


module.exports = router;
