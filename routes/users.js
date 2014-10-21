var express = require('express');
var router = express.Router();
var User = require('../model/User');
var passport = require('passport');
var evesso = require('../lib/evesso');
var Character = require('../model/Character');

router.get('/login', function(req, res) {
  if (req.isAuthenticated()) {
    res.redirect('/');
    return;
  }
  res.render('login.jade', {
    loginerror: req.flash('error')
  });
});

router.get('/register', function(req, res) {
  if (req.isAuthenticated()) {
    req.flash('info','Already logged in as ' + req.user.username + '!');
    res.redirect('/');
    return;
  }
  res.render('register.jade');
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
  req.flash("info", "Logged out")
  res.redirect('/');
});

router.post('/login', passport.authenticate('local', { successRedirect: '/loginredirect',
                                   failureRedirect: '/login', failureFlash: true }));



router.get('/loginsso', evesso.authorize());

router.get('/evecb', function(req, res, next) {
  evesso.authenticate(req, function(err, tokenData){
    if (err) return next (err);
    evesso.verify(req, tokenData, function(err, characterData) {
      if (err) return next(err);
      characterLoggedIn(req,res,next,characterData);
    });
  });

});

function characterLoggedIn(req,res,next,characterData) {
  Character.find({CharacterID: characterData.CharacterID}).populate('User').exec(function(err, result) {
    debugger;
    if (err) return next(err);
    if (result.length > 0) {
      var savedCharacter = result[0];
      //savedCharacter.populate("User");
      if (savedCharacter.Validated) {
        req.login(savedCharacter.User, function(err) {
          if (err) return next(err);
          return res.redirect('/loginredirect');
        });
      } else {
        req.session.savedCharacter = savedCharacter;
        return res.redirect('/connectaccounts');
      }
    } else {
      req.session.characterData = characterData;
      return res.redirect('/connectaccounts');
    }
  });

  //res.end(JSON.stringify(characterData));
}

router.get('/connectaccounts', function(req,res,next) {
  debugger;
  var savedCharacter = req.session.savedCharacter;
  var characterData = req.session.characterData;
  req.session.characterData = null;
  req.session.savedCharacter = null;

  if (savedCharacter) {
    // Character known, but not validated
    if (req.isAuthenticated()) {
      if (savedCharacter.User.username == req.user.username) {
        // Character known for logged in user - validate
        return validateCharacter(savedCharacter, req, res, next);
      } else {
        // Character known, but on a different user
        req.session.savedCharacter = savedCharacter;
        return res.redirect('/user/' + req.user.username + '/merge');
      }
    }
  } else if (characterData) {
    if (req.isAuthenticated()) {
      var char = new Character({
        CharacterID: characterData.CharacterID,
        Validated: true,
        CharacterName: characterData.CharacterName,
        CharacterOwnerHash: characterData.CharacterOwnerHash,
        User: req.user._id
      });
      char.save(function(err) {
        if (err) return next(err);
        return res.redirect('/user/' + req.user.username);
      });
    }
  } else {
    var err = new Error("No character or user found");
    err.status = 404;
    next(err);
  }
});

function validateCharacter(savedCharacter, req, res, next) {
  savedCharacter.Validated = true;
  savedCharacter.save(function(err) {
    if (err) return next(err);
    res.redirect('/user/' + req.user.username);
  });
}



router.get('/loginredirect', function(req,res) {
  var redirect = req.session.loginredirect;
  req.flash("info", "Logged in as " + req.user.username);
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
  });
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
