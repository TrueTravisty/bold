var express = require('express');
var router = express.Router();
var User = require('../model/User');
var passport = require('passport');
var slideshow = require('./slideshow');
var permissions = require('../model/permissions.json');

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
  res.locals.mainpages.push({
        path: '/admin',
        name: 'admin',
        displayname: 'Admin'
      })
  return next();
});

router.get('/', function(req,res) {
  res.render('admin/admin.jade', {
    current: 'admin',
    canusers: req.can('manageusers'),
    canupdate: req.can('updatesite')
  });
});

router.get('/users', function(req,res) {
  if (!req.can('manageusers')) {
    return res.redirect("/admin");
  }

  User.find({}, function(err, users){
    if (err) {
      return next(err);
    }
    else if (!users) {
      return next(new Error('failed to load users'));
    }
    res.render('admin/users.jade', {
      current:    'users',
      users:      users,
      canedit:    req.can('manageusers'),
      candelete:  req.can('deleteuser'),
      canroles:   req.can('manageroles')
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
    if (!req.ruser.api)
      req.ruser.api="";
    if (!req.ruser.apiVer)
      req.ruser.apiVer="";
    next();
  });
});

router.get('/users/:user', function(req,res, next) {
   if (!req.can('manageusers')) {
     var err = new Error("Not authorized!");
     err.status = 401;
     return next(err);
   }
   if (req.param('delete', 'no') == 'yes' && req.can('deleteuser')){
     if (req.ruser.username != "superadmin"){
       return User.remove({ username: req.ruser.username}, function(err){
         if (err) next(err);
         res.redirect(".");
       });
     }
   }
   debugger;
   res.render('admin/user.jade', {
     edituser:req.ruser,
     roles:roles,
     canroles:req.can('manageroles'),
     message:''
   })
});

router.post('/users/:user', function(req,res,next) {
  if (!req.can('manageusers')) {
    var err = new Error("Not authorized!");
    err.status = 401;
    return next(err);
  }
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
  debugger;
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

/* Other routes mapped to admin */
router.use(slideshow);


module.exports = router;
