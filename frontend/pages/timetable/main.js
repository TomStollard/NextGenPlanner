function loadtometablepage(callback){
  if(user.name.substr(-1, 1) == "s"){
    $("#page-tometable .header-desktop h1, #page-tometable .header-mobile h1").html(user.name + "' Tometable");
  }
  else{
    $("#page-tometable .header-desktop h1, #page-tometable .header-mobile h1").html(user.name + "'s Tometable");
  }
  if(options.tometable.mode == "day"){
    $("#tometablecontainer").html(
      templates.tometable.daymode({
        periods: options.tometable.periods,
        days: dbdata.tometable.sortintodays(dbdata.tometable.addlessonheight(tometable))
      })
    );
  }
  if(options.tometable.mode == "week"){
    $("#tometablecontainer").html(
        templates.tometable.weekmode({
          periods: options.tometable.periods,
          weeks: dbdata.tometable.sortintoweeks(dbdata.tometable.addlessonheight(tometable))
        })
    );
  }
  $(".tometablelessoninner").click(function(){
    $("#modal-editlesson").data("id", $(this).parent().data("id"));
    $("#modal-editlesson").trigger("show");
  });
  callback();
}

$("#page-tometable").on("load", function(){
  loadtometablepage(function(){
    $("#page-tometable").trigger("loaded");
  });
});

$(".button-tometable-main").click(function(){
  switchpage("main");
});

$("#addlessonbutton").click(function(){
  $("#modal-addlesson").trigger("show");
});
