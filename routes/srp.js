var express = require('express');
var router = express.Router();
var User = require('../model/User');
var eveApi = require('../lib/eveApi');
var invType = require('../model/invType');
var invGroup = require('../model/invGroup');
var mapSolarSystems = require('../model/mapSolarSystem');
var zkbApi = require('../lib/zkbApi');

router.use(validateSrp);

function validateSrp(req, res, next) {
  if (!req.isAuthenticated()) {
    req.session.loginredirect = req.originalUrl;
    return res.redirect('/login');
  } else {
    if (!req.can('submitsrp')) {
      var err = new Error('SRP only available for corp members');
      err.status = 401;
      return next(err);
    }
  }
  next();
}

router.validateSrp = validateSrp;


router.get('/losses', function(req, res, next) {
  zkbApi.getZbkLossesForCharacter(req.user.characterID, 50, function(err, losses) {
    if (err) return next(err);
    getDbInfo(losses, function(err, losses) {
      if (err) return next(err);
      res.render('includes/losslist', {
        losses:losses
      })
    });
  });
});

function getDbInfo(losses, callback) {
  var typeIDs = getUniqueIds(losses, function(loss) { return parseInt(loss.victim.shipTypeID)});

  getDbTypes(typeIDs, function(err, result) {
    var rl = result.length;

    for (var i = 0, l = losses.length; i < l; ++i) {
      var id = losses[i].victim.shipTypeID;
      for (var j = 0; j < rl; ++j) {
        if (result[j].typeID == id) {
          losses[i].victim.shipType = result[j].typeName;
          losses[i].victim.shipClass = result[j].group.groupName;
          break;
        }
      }
    }

    var systemIds = getUniqueIds(losses, function(loss){return parseInt(loss.solarSystemID)});
    mapSolarSystems.find({solarSystemID: {$in: systemIds}}, 'solarSystemID solarSystemName', function(err, systems) {
      if (err) return callback(err);
      var sysLen = systems.length;
      for (var i = 0, l = losses.length; i < l; ++i) {
        for (var j = 0; j < sysLen; ++j) {
          if (systems[j].solarSystemID == losses[i].solarSystemID){
            losses[i].solarSystemName = systems[j].solarSystemName;
            break;
          }
        }
      }

      callback(null, losses);
    });

  });

}

function getUniqueIds(src, getId) {
  var u = {}, typeIDs = [];
  for (var i = 0, l = src.length; i < l; ++i) {
    var id = getId(src[i]);
    if (u.hasOwnProperty(id)) continue;
    typeIDs.push(id);
    u[id] = 1;
  }
  return typeIDs;
}


function getDbTypes(typeIDs, callback) {
  var query = {typeID: {$in: typeIDs}};

  invType.find(query, function(err, types) {
    if (err) return callback(err);
    var groupIDs = getUniqueIds(types, function(type) {return type.groupID});
    invGroup.find({groupID: {$in: groupIDs}}, function(err, groups){ 
      if (err) return callback(err);
      var tc = types.length;
      var gc = groups.length;
      for (var i = 0; i < tc; ++i) {
        var gid = types[i].groupID;
        for (var j = 0; j < gc; ++j) {
          if (groups[j].groupID == gid) {
            types[i].group = groups[j];
            break;
          }
        }
      }

      return callback(null, types);
    });
  });
}

module.exports = router;
