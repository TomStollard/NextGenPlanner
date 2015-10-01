$("#page-tometable").on("load", function(){
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
  $(this).trigger("loaded");
});

$(".button-tometable-main").click(function(){
  switchpage("main");
});

$("#addlessonbutton").click(function(){
  $("#modal-addlesson").html(
    templates.tometable.modals.addlesson.main({
      periods: options.tometable.periods,
      days: options.tometable.schooldays,
      weekmode: Boolean(options.tometable.mode == "week"),
      numweeks: options.tometable.multiweek.numweeks
    })
  ).modal("show");
});
