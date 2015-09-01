$(document).ready(function(){
  switchpage("login");
});

function switchpage(newpage){
  var newpagediv = $("#page-" + newpage);
  var visiblepages = $(".page.visible");
  visiblepages.removeClass("visible");
  newpagediv.data("loaded", false);
  newpagediv.on("loaded", function(){
    newpagediv.data("loaded", true);
  })
  newpagediv.trigger("load");
  visiblepages.fadeOut(function(){
    newpagediv.off("loaded");
    if(newpagediv.data("loaded")){
      newpagediv.fadeIn(function(){
        newpagediv.addClass("visible");
        newpagediv.trigger("visible");
      });
      newpagediv.data("loaded", false);
    }
    else{
      newpagediv.on("loaded", function(){
        newpagediv.fadeIn(function(){
          newpagediv.addClass("visible");
          newpagediv.trigger("visible");
        });
      });
    }
  });
}

$("#loginform").submit(function(event){
  event.preventDefault();
  return false;
});

$("#page-login").on("load", function(){
  $("#loginform-username").val("");
  $("#loginform-password").val("");
  $("#page-login").trigger("loaded");
});

$("#page-login").on("visible", function(){
  $("loginform-username").focus();
});

$("#page-loading").on("load", function(){
  $(this).trigger("loaded");
})
