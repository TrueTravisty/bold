var express = require('express');
var router = express.Router();
var User = require('../model/User');
var passport = require('passport')

router.get('/login', function(req, res) {
  if (req.isAuthenticated()) {
    res.redirect('/');
    return;
  }
  res.render('login', {
    loginerror: req.flash('error')
  });
});

router.get('/register', function(req, res) {
  if (req.isAuthenticated()) {
    res.redirect('/');
    return;
  }
  res.render('register');
});

router.post('/register', function(req, res) {
  User.register(new User({ username: req.body.username }), req.body.password, function(err, user) {
    if (err) {
      return res.end('Error');
    }
    req.login(user, function(err) {
      if (err) { return next(err); }
      return res.end('OK');
    });
    
  });
});

router.get('/logout', function(req,res) {
  req.logout();
  res.redirect('/');
})

router.post('/login', passport.authenticate('local', { successRedirect: '/loginredirect',
                                   failureRedirect: '/login', failureFlash: true }));
      
      
router.get('/loginsso', passport.authenticate('eve-authz'));                               

router.get('/evecb',passport.authenticate('eve-authz', { successRedirect: '/',
                                      failureRedirect: '/login' }));


router.get('/loginredirect', function(req,res) {
  var redirect = req.session.loginredirect;
  if (redirect) {
    req.session.loginredirect = false;
    return res.redirect(redirect);
  }
  res.redirect("/");
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

router.get('/user/:user', function(req,res) {
   if (!req.isAuthenticated()) {
    req.session.loginredirect = req.originalUrl;
    res.redirect('/login');
    return;
   } 
   
   if (req.user.username == req.ruser.username) {
    res.render('user', {user:req.ruser, message: ""});
    return;
   } else if (req.can('manageusers')) {
     res.redirect('/admin/users/' + req.ruser.username);
     return;
   }
   res.redirect('/');
});

router.post('/user/:user', function(req,res,next) {
  req.ruser.displayname = req.body.displayname;
  req.ruser.email = req.body.email;
  req.ruser.api = req.body.api;
  req.ruser.apiVer = req.body.apiVer;
  req.ruser.save(function(err) {
    if (err) return next(err);
    res.render('user', {user:req.ruser, message:"Data saved successfully!"});
  })
});

router.get('/currentuser', 
  function(req, res) {
    if (req.isAuthenticated()) {
      res.end(req.user.username);
    } else {
      res.end('');
    }
  });


module.exports = router;
