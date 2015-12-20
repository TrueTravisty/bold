var express = require('express');
var router = express.Router();
var seat = require('./../lib/seatdb');

router.use(function(req,res,next) {
  if (!req.isAuthenticated()) {
    req.session.loginredirect = req.originalUrl;
    return res.redirect('/login');
  }
  if (!req.can('roster') || !req.can('seecorppage')) {
    var err = new Error("Not authorized!");
    err.status = 401;
    return next(err);
  }
  
  return next();
});

router.get('/', function(req, res, next) {
	return res.render('roster',
        { current: 'roster' }		
    );    
});

router.get('/roster.json', function(req, res, next) {
    var settings = req.app.get("settings").settings;
	var corpId = settings['corp-id'];
	
	seat.getMembers(corpId, function(err, members) {
		if (err) return next(err);
		
		res.json(members);
	});
})

router.param('member', function(req, res, next, id) {
   seat.getCharacterInfo(id, function(err, character) {
       if (err) return next(err);
       if (character && character.comments){
           for (var i = 0, l = character.comments.length; i<l;++i){
               character.comments[i].editable = false && (req.can('administrate') || req.username == character.comments[i].user);
           }
       }
       
       req.member = character;
       return next();
   });
   
});

router.get('/:member', function(req, res, next) {
   res.render('rostertoon', {
       current: 'roster',
       member: req.member
   });
});

router.get('/:member/comments', returnComments);

function returnComments(req, res, next) {
    seat.getCharacterComments(req.member.characterID, function(err, comments) {
        if (err) return next(err);
        for (var i = 0, l = comments.length; i<l;++i){
            comments[i].editable = (req.can('administrate') || req.username == comments[i].user);
        }
        res.render('includes/comments', {comments: comments})    
    }); 
}

router.get('/:member/comments.json', function(req, res, next) {
    seat.getCharacterComments(req.member.characterID, function(err, comments) {
        if (err) return next(err);
        var result = comments.map(function(dbComment) {
            return {
                id: dbComment.id,
                user: dbComment.user,
                text: dbComment.text,
                time: dbComment.updated_at
            }
        })
        res.json(result);
    });
})


router.post('/:member/comments', function(req,res, next){
    var text = req.body.text;
    var user = req.user.username;
    var id = req.member.characterID;
    
    seat.addCharacterComment(id, user, text, function(err) {
        if (err) return next(err);
        returnComments(req, res, next);
    });
            
});

router.param('comment', function(req, res, next, id) {
    req.commentId = id;
    next();
})

router.delete('/:member/comment/:comment', function(req,res,next) {
   var commentId = req.commentId;
   seat.getCharacterComments(req.member.characterID, function(err, comments) {
        if (err) return next(err);
        var found = false;
        for (var i = 0, l = comments.length; i < l; ++i) {
            if (comments[i].id == commentId){
                found = true;
                break;
            }
        }
        if (!found) { return res.status(404).send('Member comment with that id not found') }
        
        seat.deleteCharacterComment(commentId, function(err) {
            if (err) return next(err);
            return res.status(200).send();
        })     
                    
    });        
});

router.get('/:member/exemption', function(req, res, next) {
    if (!req.member) {
        var err = Error("Member not found");
        err.status(404);
        return next(err);
    }
    //return res.send(JSON.stringify(req.member));
    seat.hasExemption(req.member.characterID, function(err, exemption) {
       if (err) return next (err);
       if (exemption && exemption.length == 1 && exemption[0].reason) return res.send(exemption[0].reason);
       return res.send("");  
    });
});

router.post('/:member/exemption', function(req, res, next) {
    if (!req.member) {
        var err = Error("Member not found");
        err.status(404);
        return next(err);
    }
    seat.addExcemption(req.member.characterID, req.body.reason, function(err) {
        if (err) return next (err);
        res.status(201).send("");
    })
});

router.delete('/:member/exemption', function(req, res, next) {
   if (!req.member) {
        var err = Error("Member not found");
        err.status(404);
        return next(err);
    }
    seat.addExcemption(req.member.characterID, "", function(err) { // empty reason will be treated as no exemption
        if (err) return next (err);
        res.status(201).send("");
    })
})



module.exports = router;
