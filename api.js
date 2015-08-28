module.exports = function(db){
  var express = require("express");
  var router = express.Router();
  var basicAuth = require("basic-auth");


  function unauthorised(res){
    res.set('WWW-Authenticate', 'Basic realm=API Auth Required');
    return res.sendStatus(401);
  }

  router.use(function(req, res, next){
    //proccesses basic auth
    var basicauthdetails = basicAuth(req);
    if(!basicauthdetails || !basicauthdetails.name || !basicauthdetails.pass){
      return unauthorised(res);
    }
    else
    {
      req.auth = {
        userid: basicauthdetails.name,
        token: basicauthdetails.pass
      };
      return next();
    }
  });

  router.use(function(req, res, next){
    //checks token matches username
    db.sessions.findOne({
      userid: req.auth.userid,
      token: req.auth.token
    }, function(err, session){
      if(session){
        if((session.expiry == 0) || (session.expiry > Date.now())){
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

  router.get("/", function(req, res){
    //res.write("Hello World!");
    res.json(req.auth);
    //res.end();
  });

  return router;
}
