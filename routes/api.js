var express = require('express');
var router = express.Router();
var User = require('../model/User');
var passport = require('passport');
var evesso = require('../lib/evesso');
var Character = require('../model/Character');
var Api = require('../model/Api');
var eveApi = require('../lib/eveApi');

router.use(function(req, res, next) {
  if (!req.isAuthenticated()) {
    var err = new Error("Not logged in!");
    err.status = 401;
    return next(err);
  }
  return next();
});

router.post('/', function(req, res) {
  if (!req.body.apiKey || !req.body.apiVerification) {
    var err = new Error("Missing apiKey or apiVerification");
    err.status = 400;
    return next(err);
  }
  Api.find({User: req.user._id, key: req.body.apiKey}, function(err, found) {
    if (err) return next(err);
    var api = null;
    if (found.length > 0) {
      api = found[0];
      api.key = req.body.apiKey;
    } else {
      api = new Api({User: req.user._id, key: req.body.apiKey, code: req.body.apiVerification});
      api.save(function(err) {
        if (err) {
          var err = new Error("Could not save API");
          err.status = 500;
          return next(err);
        }
        res.end("OK");
      });
    }
  });
});

router.get('/', function(req,res) {
  Api.find({User: req.user._id}, function(err, result) {
    if (err) return next(err);
    res.render('includes/apiKeyList', {
      apis: result
    })
  });
});

router.post('/validate', eveApi.validate());


router.param('apiKey',function(req, res, next, id){
  req.apiKey = id;
  next();
});

router.delete('/delete/:apiKey', function(req, res, next) {
  var key = req.apiKey;
  console.log("Delete request for api: " + key);
  Api.find({key: key, User: req.user._id}, function(err, result) {
    if (err) return next(err);
    if (result.length <= 1) {
      var api = result[0];
      
      api.remove(function(err){
        if (err) return next(err);
        res.end("REMOVED");
      });

    } else res.end("NOT FOUND");

  });
});


module.exports = router;
