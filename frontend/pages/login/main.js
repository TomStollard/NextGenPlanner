$("#page-login").on("load", function(){
  $("#pane-login").trigger("active");
  $("#pane-login").trigger("activedisplayed");
  $("#page-login").trigger("loaded");
});

$("#pane-login").on("active", function(){
  $("#loginform-username").val("").focus();
  $("#loginform-password").val("");
  $("#loginform-rememberme input").prop('checked', false);
  $("#loginform-devicename").val("");
});

$("#pane-login").on("activedisplayed", function(){
  $("#loginform-username").focus();
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

$("#page-login .panel-title a").click(function(){
  var panel = $(this).parent().parent();
  if(panel.hasClass("active")){
    panel.removeClass("active");
    panel.find(".panel-content").slideUp();
  }
  else{
    $("#page-login .pane.active .panel-content").slideUp();
    $("#page-login .pane.active").removeClass("active");
    panel.addClass("active");
    panel.trigger("active");
    panel.find(".panel-content").slideDown(function(){
      panel.trigger("activedisplayed");
    });
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

$("#pane-signup").on("activedisplayed", function(){
  $("#signupform input[name='username']").focus();
});

$("#signupform").submit(function(e){
  e.preventDefault();
  $.ajax({
    type: "POST",
    url: "/login/signup",
    data: {
      username: $("#signupform input[name='username']").val(),
      password: $("#signupform input[name='password']").val(),
      name: $("#signupform input[name='name']").val(),
      email: $("#signupform input[name='email']").val()
    },
    success: function(){
      $("#pane-login .panel-title a").click();
      $("#loginform-username").val($("#signupform input[name='username']").val());
      $("#loginform-password").val($("#signupform input[name='password']").val());
    }
  });
});
