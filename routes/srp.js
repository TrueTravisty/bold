var express = require('express');
var router = express.Router();
var seat = require('./../lib/seatdb');

function isSrpManager(req,res,next) {
    if (!req.can('managesrp') || !req.can('seecorppage')) {
        var err = new Error("Not authorized!");
        err.status = 401;
        return next(err);
    }
    return next();
}

router.get('/ships.json', isSrpManager, function(req,res, next) {
    seat.getAllShipInfo(function(err, result) {
       if (err) {
           res.status(500);
           return res.json({'error': err});           
       }
       return res.json(result);
    });
});


module.exports = router;
