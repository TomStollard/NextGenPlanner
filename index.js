var express = require("express"),
    mongojs = require("mongojs");

var app = express();

var db = mongojs("NextGenPlanner", ["sessions", "users"]);

var test = "hello";

var apirouter = require("./api.js")(db);
var loginrouter = require("./login.js")(db);
require("./oldsessionclear.js")(db);

app.use("/api", apirouter);
app.use("/login", loginrouter);

app.listen(3000);
