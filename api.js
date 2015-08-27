module.exports = function(){
  var express = require("express");
  var router = express.Router();

  router.use("/", function(req, res){
    res.write("Hello World!");
    res.end();
  });

  return router;
}
