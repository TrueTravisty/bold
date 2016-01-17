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

module.exports = router;
