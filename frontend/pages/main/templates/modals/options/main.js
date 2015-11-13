$("#modal-options-main").on("show", function(){
  dbdata.sessions.getall(function(allsessions){
    var sessions = dbdata.sessions.filterbytype(allsessions, "browser");
    $.each(sessions, function(i, session){
      if(session._id == credentials.sessionid){
        session.description = "(Current) " + session.description;
        session.current = true;
      }
      else{
        session.current = false;
      }
    });
    var apikeys = dbdata.sessions.filterbytype(allsessions, "api");
    $("#modal-options-main").html(
      templates.main.modals.options.main({
        user: user,
        sessions: sessions,
        apikeys: apikeys
      })
    );
    $("form#generateapikey input[name='expiry']").pickadate();
    $("form#generateapikey").submit(function(e){
      e.preventDefault();
      dbdata.sessions.insert({
        description: $("form#generateapikey input[name='description']").val(),
        expiry: new Date($("form#generateapikey input[name='expiry']").val()).getTome() || 0
      }, function(session){
        $("#modal-options-main").modal("hide");
        bootbox.alert({title: "API Key Generated", message: "Your user ID is: " + credentials.userid + "<br>Your API key is: " + session._id + "<p>Please keep this API key safe and ensure you do not publish it online, as it would allow full access to your account, including functionality such as changing your password."})
      });
    });
    $("#options-main-main form").submit(function(e){
      e.preventDefault();
      dbdata.user.update({
        name: $("#options-main-main form input[name='name']").val(),
        email: $("#options-main-main form input[name='email']").val()
      }, function(){
        alert("done");
      });
    });
    $("#options-main-password form").submit(function(e){
      e.preventDefault();
      if($("#options-main-password form input[name='newpassword1']").val() && $("#options-main-password form input[name='newpassword1']").val()){
        if($("#options-main-password form input[name='newpassword1']").val() == $("#options-main-password form input[name='newpassword2']").val()){
          dbdata.user.update({
            password: $("#options-main-password form input[name='newpassword1']").val()
          }, function(){
            $("#options-main-password form input[name='newpassword1'], #options-main-password form input[name='newpassword2']").val("");
            bootbox.alert({title: "Password Changed", message: "Your password has been changed. If this was due to a security issue, you may want to cancel existing sessions and API keys."});
          });
        }
        else{
          bootbox.alert("The passwords entered must be the same.");
        }
      }
      else{
        bootbox.alert("You must enter a password.");
      }
    });
    $("#modal-options-main .deletebutton").click(function(){
      var item = $(this).parent().parent();
      dbdata.sessions.delete($(item).data("id"), function(){
        $(item).hide();
      });
    });
    $("#modal-options-main .nav").tab();
    $("#modal-options-main").modal("show");
  });
});
