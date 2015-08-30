var express = require("express"),
    mongojs = require("mongojs"),
    dotenv = require("dotenv");

dotenv.load();

var app = express();

var db = mongojs(process.env.DBURL, ["sessions", "users"]);

var apirouter = require("./api.js")(db);
var loginrouter = require("./login.js")(db);
require("./oldsessionclear.js")(db);

app.use("/api", apirouter);
app.use("/login", loginrouter);

app.listen(3000);
