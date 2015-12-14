$("#modal-options-main").on("show", function(){
  offline.connectivitytest(function(){
    $("#modal-options-main").data("changes", false);
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
          apikeys: apikeys,
          syncenabled: localoptions.offlinesync,
          remembered: Boolean(localStorage.credentials),
          syncinterval: localoptions.syncinterval
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
          reloaduser(function(){
            bootbox.alert("Changes saved.");
            $("#modal-options-main").data("changes", true);
          });
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
      $("#options-main-sync form").submit(function(e){
        e.preventDefault();
        var syncinterval = parseFloat($("#options-main-sync form input[name='syncinterval']").val());
        if(syncinterval){
          localoptions.syncinterval = syncinterval;
          offline.writelocaloptions();
          offline.tomedsync();
          bootbox.alert("New interval has been set.");
        }
      });
      $("#modal-options-main .deletebutton").click(function(){
        var item = $(this).parent().parent();
        dbdata.sessions.delete($(item).data("id"), function(){
          $(item).hide();
        });
      });
      $("#modal-options-main #enablesync").click(function(){
        $("#modal-options-main #enablesync").off("click");
        offline.setup(function(progress){
          $("#modal-options-main #enablesync").html((progress * 100) + "% set up");
        }, function(){
          $("#options-main-sync").html("Syncing has been set up.");
        });
      });
      $("#modal-options-main #disablesync").click(function(){
        offline.disable(function(){
          $("#options-main-sync").html("Syncing has been disabled.");
        });
      });
      $("#modal-options-main .nav").tab();
      $("#modal-options-main").modal("show");
    });
  }, function(){
    bootbox.alert("Sorry, you must be online to do that.");
  });
});

$("#modal-options-main").on("hidden.bs.modal", function(){
  if($("#modal-options-main").data("changes")){
    switchpage("main");
  }
});
