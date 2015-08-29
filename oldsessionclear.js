module.exports = function(db){
  setInterval(function(){
    db.sessions.remove({
      expiry: {
        $lt: Date.now(),
        $gt: 0
      }
    }, function(err, numremoved){
      if(err){
        console.log(err);
      }
    });
  }, 60000)
}
