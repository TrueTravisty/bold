var express = require('express');
var router = express.Router();
var User = require('../model/User');
var passport = require('passport');
var slideshow = require('./slideshow');



router.use(function(req,res,next) {
  if (!req.isAuthenticated()) {
    req.session.loginredirect = req.originalUrl;
    res.redirect('/login');
    return;
  }
  res.locals.mainpages.push({
        path: '/admin',
        name: 'admin',
        displayname: 'Admin'
      })
  return next();
});

router.get('/', function(req,res) {
  res.render('admin/admin', { current: 'admin'});
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
    res.render('admin/users', { 
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
     return res.redirect("/admin");
   }
   if (req.param('delete', 'no') == 'yes' && req.can('deleteuser')){
     if (req.ruser.username != "superadmin"){
       return User.remove({ username: req.ruser.username}, function(err){
         if (err) next(err);
         res.redirect(".");
       });
     }
   }
   res.end(req.ruser.username);
});


/* Other routes mapped to admin */
router.use(slideshow);


module.exports = router;