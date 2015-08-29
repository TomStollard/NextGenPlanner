module.exports = function(db){
  var express = require("express");
  var router = express.Router();
  var basicAuth = require("basic-auth");
  var bcrypt = require('bcrypt');

  router.get("/", function(req, res){
    var basicauthdetails = basicAuth(req);
    function unauthorised(res){
      res.set('WWW-Authenticate', 'Basic realm=Login details required');
      res.sendStatus(401);
    }

    if(!basicauthdetails || !basicauthdetails.name || !basicauthdetails.pass){
      //some auth details are missing
      unauthorised(res);
    }
    else
    {
      //auth details present
      //check mongodb
      db.users.findOne({
        username: basicauthdetails.name,
      }, function(err, user){
        if(user){
          bcrypt.compare(basicauthdetails.pass, user.password, function(err, correct){
            if(correct){
              //user passwd correct
              //start new session
              var uuid = require('node-uuid');
              var sessionid = uuid.v4();
              if(req.query.devicename){
                var expiry = 0;
              }
              else {
                var expiry = Date.now() + 600000;
              }
              db.sessions.insert({
                _id: sessionid,
                userid: db.ObjectId(user._id).toString(),
                expiry: expiry,
                type: "browser",
                description: req.query.devicename
              });
              res.json({
                userid: user._id,
                sessionid: sessionid
              });
            }
            else {
              unauthorised(res);
            }
          });
        }
        else {
          unauthorised(res);
        }
      });
    }
  });

  return router;
}
