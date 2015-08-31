var express = require("express"),
    mongojs = require("mongojs"),
    dotenv = require("dotenv"),
    bodyParser = require('body-parser');

dotenv.load();

var app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var db = mongojs(process.env.DBURL, ["sessions", "users", "homework"]);

var apirouter = require("./api.js")(db);
var loginrouter = require("./login.js")(db);
require("./oldsessionclear.js")(db);

app.use("/api", apirouter);
app.use("/login", loginrouter);

app.listen(3000);
