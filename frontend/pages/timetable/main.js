$("#page-tometable").on("load", function(){
  if(options.tometable.mode == "day"){
    $("#tometablecontainer").html(
      templates.tometabledaymode({
        periods: options.tometable.periods,
        days: dbdata.tometable.sortintodays(dbdata.tometable.addlessonheight(tometable))
      })
    );
  }
  if(options.tometable.mode == "week"){
    console.log("HI!");
    console.log(dbdata.tometable.sortintoweeks(dbdata.tometable.addlessonheight(tometable)));
    $("#tometablecontainer").html(
        templates.tometableweekmode({
          periods: options.tometable.periods,
          weeks: dbdata.tometable.sortintoweeks(dbdata.tometable.addlessonheight(tometable))
        })
    );
  }
  $(this).trigger("loaded");
});

$(".button-tometable-main").click(function(){
  switchpage("main");
});
