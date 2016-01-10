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

router.get('/', renderRoster);

function renderRoster(req,res,next) {
    return res.render('roster',
        { current: 'roster' }		
    );    
}

router.get('/character-info', function(req, res) {
    return res.render('includes/rosterCharacterInfo');
})

router.get('/character-comments', function(req,res) {
    return res.render('includes/rosterComments');
})

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

router.get('/:member', renderRoster);

router.get('/toon/:member', function(req, res, next) {
   res.json(req.member);
});

router.get('/toon/:member/comments', function(req, res, next) {
    seat.getCharacterComments(req.member.characterID, function(err, comments) {
        if (err) return next(err);
        var result = comments.map(function(dbComment) {
            return {
                id: dbComment.id,
                user: dbComment.user,
                text: dbComment.text,
                time: dbComment.updated_at,
                canEdit: dbComment.user == req.user.username || req.can('administrate')
            }
        })
        res.json(result);
    });
})


router.post('/toon/:member/comments', function(req,res, next){
    var text = req.body.text;
    var user = req.user.username;
    var id = req.member.characterID;
    
    seat.addCharacterComment(id, user, text, function(err) {
        if (err) return next(err);
        res.status(201).send("");
    });
            
});

router.param('comment', function(req, res, next, id) {
    req.commentId = id;
    next();
})

router.delete('/toon/:member/comments/:comment', function(req,res,next) {
   var commentId = req.commentId;
   seat.getCharacterComments(req.member.characterID, function(err, comments) {
        if (err) return next(err);
        var found = false;
        var user;
        for (var i = 0, l = comments.length; i < l; ++i) {
            if (comments[i].id == commentId){
                found = true;
                user = comments[i].user;
                break;
            }
        }
        if (!found) { return res.status(404).send('Member comment with that id not found') }
        
        if (req.user.username != user && !req.can('administrate'))
            return res.status(403).send(); // forbidden
        
        seat.deleteCharacterComment(commentId, function(err) {
            if (err) return next(err);
            return res.status(200).send();
        })     
                    
    });        
});

router.put('/toon/:member/comments/:comment', function(req,res,next) {
   var commentId = req.commentId;
   seat.getCharacterComments(req.member.characterID, function(err, comments) {
        if (err) return next(err);
        var found = false;
        var user;
        for (var i = 0, l = comments.length; i < l; ++i) {
            if (comments[i].id == commentId){
                found = true;
                user = comments[i].user;
                break;
            }
        }
        if (!found) { return res.status(404).send('Member comment with that id not found') }
        
        if (req.user.username != user && !req.can('administrate'))
            return res.status(403).send(); // forbidden
        
        seat.updateCharacterComment(commentId, req.body.text, function(err) {
            if (err) return next(err);
            return res.status(200).send();
        })     
                    
    });        
    
});

router.get('/toon/:member/exemption', function(req, res, next) {
    if (!req.member) {
        var err = Error("Member not found");
        err.status(404);
        return next(err);
    }
    //return res.send(JSON.stringify(req.member));
    seat.hasExemption(req.member.characterID, function(err, exemption) {
       if (err) return next (err);
       if (exemption && exemption.length == 1 && exemption[0].reason) return res.json(exemption[0].reason);
       return res.json(false);  
    });
});

router.post('/toon/:member/exemption', function(req, res, next) {
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

router.delete('/toon/:member/exemption', function(req, res, next) {
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
