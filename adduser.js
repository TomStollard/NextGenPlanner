var mongojs = require("mongojs"),
    dotenv = require("dotenv"),
    bcrypt = require("bcrypt");

dotenv.load();

var db = mongojs(process.env.DBURL, ["users"]);

bcrypt.hash(process.argv[3], 10, function(err, hash) {
  db.users.insert({
    username: process.argv[2],
    password: hash
  });
});
