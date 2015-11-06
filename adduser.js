var mongojs = require("mongojs"),
    dotenv = require("dotenv"),
    crypto = require("crypto");

dotenv.load();

var db = mongojs(process.env.DBURL, ["users"], {authMechanism: 'ScramSHA1'});
console.log(process.env.DBURL);

var salt = crypto.randomBytes(32).toString("hex");
crypto.pbkdf2(process.argv[3], salt, 4096, 64, function(err, key) {
  db.users.insert({
    username: process.argv[2],
    password: key.toString("hex"),
    salt: salt
  }, function(err, result){
    if(err){
      console.log(err);
    }
  });
});
