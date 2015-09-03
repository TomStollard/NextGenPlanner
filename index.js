var express = require("express"),
    mongojs = require("mongojs"),
    dotenv = require("dotenv"),
    bodyParser = require("body-parser"),
    autoprefixer = require("express-autoprefixer");

dotenv.load();

var app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use("/css/main.css", autoprefixer());

var db = mongojs(process.env.DBURL, ["sessions", "users", "homework"]);

var apirouter = require("./api.js")(db);
var loginrouter = require("./login.js")(db);
require("./oldsessionclear.js")(db);

app.use("/api", apirouter);
app.use("/login", loginrouter);

app.use(express.static("static"));

var server = app.listen(3000, function(){
  console.log("Server running on port " + server.address().port);
});
