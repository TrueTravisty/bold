var express = require('express');
var router = express.Router();
var seat = require('./../lib/seatdb');

function restrictSrpManager(req,res,next) {
    if (!req.can('managesrp') || !req.can('seecorppage')) {
        var err = new Error("Not authorized!");
        err.status = 401;
        return next(err);
    }
    return next();
}

router.get('/ships.json', restrictSrpManager, function(req,res, next) {
    seat.getAllShipInfo(function(err, result) {
       if (err) {
           res.status(500);
           return res.json({'error': err});           
       }
       return res.json(result);
    });
});

router.get('/insurance', restrictSrpManager, function(req, res, next) {
   return res.render('srp/insurance', { current: 'srp' }) 
});

router.param('id', function(req, res, next, id) {
    seat.getShipInfo(id, function(err, value) {
        if (err) return next(err);
        if (!value || value.length != 1) return next('Wrong number of ships found')
        req.ship = value[0];
        next();
    })
})

router.get('/ship/:id', restrictSrpManager, function(req, res, next) {
    return res.json(req.ship);
})

router.put('/ship/:id', restrictSrpManager, function(req,res,next) {
    if (!req.body.ship || req.body.ship.typeID != req.ship.typeID) {
        res.status(404);
        return res.json({error: "Ship not found or invalid typeID"});
    }
    seat.updateInsuranceInfo(req.body.ship.typeID, req.body.ship.notes, 
        req.body.ship.insurancePrice, req.body.ship.insurancePayout, req.body.ship.srpPercentage, function(err) {
            if (err) {
                res.status(500); 
                return res.json({error: "Could not update ship", info: err});
            }
            seat.getShipInfo(req.body.ship.typeID, function(err, value) {
                if (err) return next(err);
                if (!value || value.length != 1) return next('Wrong number of ships found')
                var ship = value[0];                
                res.json(ship);                
            })            
        })
});

module.exports = router;
