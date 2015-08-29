module.exports = function(db){
  var express = require("express");
  var router = express.Router();
  var basicAuth = require("basic-auth");


  function unauthorised(res){
    res.set('WWW-Authenticate', 'Basic realm=API Auth Required');
    return res.sendStatus(401);
  }

  router.use(function(req, res, next){
    //AUTH
    //proccesses basic auth
    var basicauthdetails = basicAuth(req);
    if(!basicauthdetails || !basicauthdetails.name || !basicauthdetails.pass){
      return unauthorised(res);
    }
    else
    {
      req.auth = {
        userid: basicauthdetails.name,
        sessionid: basicauthdetails.pass
      };
      return next();
    }
  });

  router.use(function(req, res, next){
    //AUTH
    //checks sessionid matches username
    db.sessions.findOne({
      userid: req.auth.userid,
      _id: req.auth.sessionid
    }, function(err, session){
      //check if a session was found and if it is valid
      if(session){
        if((session.expiry == 0) || (session.expiry > Date.now())){
          if(session.expiry > Date.now()){
            //if session is browser-based, update expiry tome
            db.sessions.update({
              _id: session._id
            }, {
              $set: {
                expiry: Date.now() + 600000
              }
            });
          }
          return next();
        }
        else {
          return unauthorised(res);
        }
      }
      else {
        return unauthorised(res);
      }
    });
  });

  router.route("/sessions")
    .get(function(req, res){
      db.sessions.find({
        userid: req.auth.userid
      }, function(err, sessions){
        res.json(sessions)
      });
    })
    .delete(function(req, res){
      db.sessions.remove({
        userid: req.auth.userid
      }, function(err, numremoved){
        if(numremoved.ok){
          res.sendStatus(200);
        }
        else {
          res.sendStatus(500);
          console.log(err);
        }
      });
    });

  router.route("/sessions/:id")
    .get(function(req, res){
      db.sessions.findOne({
        _id: req.params.id
      }, function(err, session){
        if(session){
          if(session.userid == req.auth.userid){
            res.json(session);
          }
          else {
            unauthorised(res);
          }
        }
        else {
          res.sendStatus(404);
        }
      });
    })
    .delete(function(req, res){
      db.sessions.remove({
        _id: req.params.id,
        userid: req.auth.userid
      }, function(err, numremoved){
        if(numremoved.n != 0){
          res.sendStatus(200);
        }
        else{
          res.sendStatus(404);
        }
      });
    });


  return router;
}
