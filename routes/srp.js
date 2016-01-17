var express = require('express');
var router = express.Router();
var seat = require('./../lib/seatdb');


router.get('/ships.json', function(req,res, next) {
    seat.getAllShipInfo(function(err, result) {
       if (err) {
           res.status(500);
           return res.json({'error': err});           
       }
       return res.json(result);
    });
});




module.exports = router;
