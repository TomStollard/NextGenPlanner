module.exports = function(db){
  var express = require("express");
  var router = express.Router();
  var basicAuth = require("basic-auth");
  var bcrypt = require('bcrypt');

  router.get("/", function(req, res){
    var basicauthdetails = basicAuth(req);
    function unauthorised(res){
      res.set('WWW-Authenticate', 'Basic realm=API Auth Required');
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
              res.json({
                userid: user._id,
                sessionid: "hello"
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
