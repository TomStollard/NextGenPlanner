$("#page-login").on("load", function(){
  $("#loginform-username").val("");
  $("#loginform-password").val("");
  $("#loginform-rememberme input").prop('checked', false);
  $("#loginform-devicename").val("");
  $("#page-login").trigger("loaded");
});

$("#loginform").submit(function(event){
  event.preventDefault();
  if(!($("#loginform-username").val() && $("#loginform-password").val())){
    $("#loginform-credserror").slideDown();
    return false;
  }
  var devicename = "";
  if($("#loginform-rememberme input").is(':checked')){
    devicename = $("#loginform-devicename").val();
  }
  $.ajax({
    type: "GET",
    url: "/login",
    cache: false,
    username: $("#loginform-username").val(),
    password: $("#loginform-password").val(),
    data: {"devicename": devicename},
    success: function(res, status, req){
      if(devicename){
        window.localStorage["credentials"] = JSON.stringify(res);
      }
      credentials = res;
      switchpage("main");
    },
    statusCode: {
      401: function(){
        $("#loginform-credserror").slideDown();
      }
    }
  });
  return false;
});

$("#page-login").on("visible", function(){
  $("loginform-username").focus();
});

$("#page-login .panel-title").click(function(){
  var panel = $(this).parent();
  if(panel.hasClass("active")){
    panel.removeClass("active");
    panel.find(".panel-content").slideUp();
  }
  else{
    $("#page-login .pane.active .panel-content").slideUp();
    $("#page-login .pane.active").removeClass("active");
    panel.addClass("active");
    panel.find(".panel-content").slideDown();
  }
});

$("#page-login #loginform-rememberme input").change(function(){
  if($("#loginform-rememberme input").is(':checked')){
    $("#loginform-devicename").slideDown(function(){
      $("#loginform-devicename").focus();
    });
  }
  else {
    $("#loginform-devicename").slideUp();
  }
});

$("#page-login #loginform-username, #page-login #loginform-password").on("input", function(){
  $("#loginform-credserror").slideUp();
});
