module.exports = function(db){
  var express = require("express");
  var router = express.Router();
  var basicAuth = require("basic-auth");
  var crypto = require('crypto');
  var uuid = require('node-uuid');

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
          crypto.pbkdf2(basicauthdetails.pass, user.salt, 4096, 64, function(err, key){
            if(user.password == key.toString("hex")){
              //user passwd correct
              //start new session
              if(req.query.devicename){
                var expiry = 0;
              }
              else {
                var expiry = Date.now() + 600000;
              }
              db.sessions.insert({
                userid: db.ObjectId(user._id).toString(),
                expiry: expiry,
                type: "browser",
                description: req.query.devicename,
                _id: uuid.v4()
              }, function(err, session){
                res.json({
                  userid: user._id,
                  sessionid: session._id
                });
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

  router.post("/signup", function(req, res){
    db.users.findOne({
      username: req.body.username
    }, function(err, user){
      if(user){
        res.status(422).send("Sorry, that username is already taken.")
      }
      else{
        var salt = crypto.randomBytes(32).toString("hex");
        crypto.pbkdf2(req.body.password, salt, 4096, 64, function(err, key){
          db.users.insert({
            username: req.body.username,
            name: req.body.name,
            email: req.body.email,
            salt: salt,
            password: key.toString("hex")
          }, function(){
            res.sendStatus(200);
          });
        });
      }
    });
  })

  return router;
}
