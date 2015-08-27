var express = require("express");

var app = express();

var test = "hello";

var apirouter = require("./api.js")();

app.use("/api", apirouter);

app.listen(3000);
