$(".button-global-logout").click(function(){
  $.ajax({
    type: "DELETE",
    url: "/api/sessions/" + credentials.sessionid,
    username: credentials.userid,
    password: credentials.sessionid,
    statusCode: defaultstatushandler,
    success: function(){
      credentials = "";
      window.localStorage.credentials = ""
      switchpage("login");
    }
  });
});
