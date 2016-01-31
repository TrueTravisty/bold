var express = require('express');
var router = express.Router();
var User = require('../model/User');
var passport = require('passport');
var evesso = require('../lib/evesso');
var Character = require('../model/Character');
var Api = require('../model/Api');
var eveApi = require('../lib/eveApi');
var reddit = require('../lib/reddit');
var seat = require('./../lib/seatdb');

router.get('/loginlocal', function(req, res) {
  if (req.isAuthenticated()) {
    res.redirect('/loginredirect');
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
  req.flash("success", "Logged out")
  res.redirect('/');
});

router.post('/login', passport.authenticate('local', { successRedirect: '/loginredirect',
                                   failureRedirect: '/login', failureFlash: true }));



router.get('/login', evesso.authorize());

router.get('/evecb', function(req, res, next) {
  evesso.authenticate(req, function(err, tokenData){
    if (err) return next (err);
    evesso.verify(req, tokenData, function(err, characterData) {
      if (err) return next(err);
      characterLoggedIn(req,res,next,characterData);
    });
  });

});

router.param('userid', function(req, res, next, id){
    eveApi.getPublicCharacterInfo(id, function(err, character) {
        if (err || !character) {
            var err = new Error("Not found");
            err.status = 404;
            return next(err);
        }
        req.characterData = character;
        return next();
    })  
})

router.get('/impersonate/:userid', function(req, res, next) {
   if (!req.isAuthenticated() || !req.can('administrate')) {
    var err = new Error("Not authorized!");
    err.status = 401;
    return next(err);
  } 
  var characterData = {
      CharacterID: req.characterData.characterID,
      CharacterName: req.characterData.characterName
  };
  return characterLoggedIn(req, res, next, characterData);
});

function characterLoggedIn(req,res,next,characterData) {
  User.findOne({characterID: characterData.CharacterID}, function(err, user){
    if (err) return next(err);
    if (!user) {
      User.register(new User({ username: characterData.CharacterName }), randomstring(12), function(err, user) {
        if (err) return next(err);
        user.characterID = characterData.CharacterID;
        user.save(function(err) {
          if (err) return next(err);
          req.login(user, function(err) {
            if (err) return next(err);
            return res.redirect('/loginredirect');
          });
        });
      });
    } else {
      req.login(user, function(err) {
        if (err) return next(err);
        return res.redirect('/loginredirect');
      });
    }
  });
}

function randomstring(count)
{
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for( var i=0; i < count; i++ )
      text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

router.get('/userinfo.json', function(req, res) {
   if (!req.user || !req.user.characterID) return res.json(null);
   seat.getCharacterInfo(req.user.characterID, function(err, character) {
       if (err) return next(err);
       if (!character) {
           res.status(403);
           return res.json({error: "Character information not found"});
       }
       return res.json({
           characterID: character.characterID,
           name: character.name,
           isOk: character.isOk
       })
       
   });
   
});


router.get('/exemption.json', function(req, res, next) {
    if (!req.user || !req.user.characterID) return res.json(false);
    seat.hasExemption(req.user.characterID, function(err, exemption) {
       if (err) return next (err);
       if (exemption && exemption.length == 1 && exemption[0].reason) return res.json(true);
       return res.json(false);  
    });
});


router.get('/loginredirect', function(req,res) {
  var redirect = req.session.loginredirect;
  req.flash("success", "Logged in as " + req.user.username);
  eveApi.getCorpId(req.user.characterID, function(err, id){
    if (!err) req.session.corpid = id;
    else req.session.corpid ="";
    if (redirect) {
      req.session.loginredirect = null;
      return res.redirect(redirect);
    }
    res.redirect("/");
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
    if (user.length < 1) {
      var error = new Error('User not found');
      error.status = 404;
      return next(error);
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
    if (!req.ruser.redditUser)
      req.ruser.redditUser="";
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

router.post('/reddit', function(req, res, next){
  if (!req.can('addreddituser')) {
    var error = new Error("Not logged in as corp member");
    error.status = 403;
    return next(error);
  }
  if (req.user.redditUser == req.body.redditUser) {
    return res.end("User already registered");
  }
  req.user.redditUser = req.body.redditUser;
  req.user.save(function(err) {
    if (err) return next(err);
    var Settings = req.app.get("settings");
    reddit.addUser(Settings.settings, req.body.redditUser, function(err) {
      if (err) return next(err);
      return res.end("Reddit user added OK");
    })
  })

})

router.get('/currentuser',
  function(req, res) {
    if (req.isAuthenticated()) {
      res.end(req.user.username);
    } else {
      res.end('');
    }
  });

module.exports = router;
