$(".button-global-logout").click(function(){
  async.parallel([
    function(callback){
      //delete session from server
      $.ajax({
        type: "DELETE",
        url: "/api/sessions/" + credentials.sessionid,
        username: credentials.userid,
        password: credentials.sessionid,
        statusCode: defaultstatushandler,
        success: function(){
          switchpage("login");
        }
      });
    },
    function(callback){
      //delete local DB
      localdb.delete().then(callback);
    },
    function(callback){
      //delete other stored info (credentials etc)
      localStorage.clear();
      callback();
    }
  ], function(){
    credentials = {userid: "", sessionid: ""};
  });
});
