var express = require("express"),
    mongojs = require("mongojs"),
    bodyParser = require("body-parser");

var app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var db = mongojs(process.env.DBURL, ["sessions", "users", "homework", "tometable", "weeknotes", "daynotes"], {authMechanism: 'ScramSHA1'});

var apirouter = require("./api.js")(db);
var loginrouter = require("./login.js")(db);
require("./oldsessionclear.js")(db);

app.use("/api", apirouter);
app.use("/login", loginrouter);

app.use(express.static("frontend_build"));

var server = app.listen(3000, function(){
  console.log("Server running on port " + server.address().port);
});
