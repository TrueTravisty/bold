var express = require('express');
var router = express.Router();
var permissions = require('../model/permissions.json');

router.use(function(req,res,next) {
  req.getRoles = function() {
    var u = {};
    var uniqueroles = [];
    for (var perm in permissions) {
      roles = permissions[perm];
      for (var i = 0; i < roles.length; i++) {
        if (u.hasOwnProperty(roles[i]) || roles[i] === 'corp') continue;
        u[roles[i]] = 1;
        uniqueroles.push(roles[i]);
      }
    }
    return uniqueroles;
  };

  req.can = function(verb) {
    if (!req.isAuthenticated()) return false;
    if (req.user.username=='superadmin') return true;
    if (verb in permissions) {
      var i;
      var roles = permissions[verb];
      for (var i = 0; i < roles.length; i++) {
        if (roles[i] === "corp") {
          var s = req.app.get("settings");
          return req.session.corpid == s.settings['corp-id'];
        }

        if (req.user.roles.indexOf(roles[i]) >= 0) return true;
      }
    }
    if (req.user.roles.indexOf('superadmin') >= 0) return true; // superadmin can do all
    return false;
  };

  res.locals.canadmin = req.can('administrate');
  next();

});

router.use(function(req,res,next) {
  if (req.isAuthenticated()){
    res.locals.username = req.user.username;
  } else {
    res.locals.username = "";
  }

  res.locals.mainpages = [
      {
        path: '/',
        name: 'home',
        displayname: 'Home'
      },
      {
        path: '/team',
        name: 'team',
        displayname: 'Team'
      },
      {
        path: '/buyback',
        name: 'buyback',
        displayname: 'Buyback'
      }
    ];

  if (req.can('submitsrp')) {
    res.locals.mainpages.push({
      path: '/submitsrp',
      name: 'srp',
      displayname: 'SRP'
    })
  }
  
  if (req.can('roster')) {
      res.locals.mainpages.push({
          path: '/roster',
          name: 'roster',
          displayname: 'Roster'
      })
  }

  res.locals.flash = {
    errors: [],
    warnings: [],
    notices: []
  };

  req.flash("error").forEach(function(msg) {
    res.locals.flash.errors.push(msg);
  });
  req.flash("warning").forEach(function(msg) {
    res.locals.flash.warnings.push(msg);
  });
  var all = req.flash();
  for (cat in all) {
    if (cat === "error" && cat === "warning") {
      continue;
    }
    all[cat].forEach(function(msg) {
      res.locals.flash.notices.push(msg);
    });
  }

  res.locals.lookuppath = function(name) {
      for (var i = 0; i < res.locals.mainpages.length; i++) {
        if (name === res.locals.mainpages[i].name) return res.locals.mainpages[i].displayname;
      }
      if (name == "info_newtobold")
        return "/info/newtobold";
    };
  res.locals.title = "BO_LD";
  res.locals.current = "";
  return next();
})


module.exports = router;
