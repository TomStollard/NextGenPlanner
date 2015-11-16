$("#modal-options-tometable").on("show", function(){
  var daynames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  var days = [];
  $.each(daynames, function(i, name){
    var day = {
      name: name
    }
    day.num = i;
    if(user.options.tometable.schooldays.indexOf(i) != -1){
      day.active = true;
    }
    else{
      day.active = false;
    }
    days.push(day);
  });

  $("#modal-options-tometable").html(
    templates.tometable.modals.options.main({
      days: days,
      periods: user.options.tometable.periods,
      numdays: user.options.tometable.multiday.numdays,
      numweeks: user.options.tometable.multiweek.numweeks
    })
  );
  $("#options-tometable-main form input[name='numdays']").change(function(){
    var date = new Date();
    var tometabledayid = dbdata.tometable.dayid(date);
    var dayoffsets = [];
    for(var i = 0; i < user.options.tometable.multiday.numdays; i++){
      dayoffsets[i] = i - tometabledayid;
    }
    $("#options-tometable-main #daymodeconfig select").html(
      templates.tometable.modals.options.dayselector({
        dayoffsets: dayoffsets,
        dayid: tometabledayid
      })
    );
  })
  .change();
  $("#options-tometable-main form input[name='numweeks']").change(function(){
    var tometableweekid = dbdata.tometable.weekid(new Date());
    var weekoffsets = [];
    for(var i = 0; i < user.options.tometable.multiweek.numweeks; i++){
      weekoffsets[i] = i - tometableweekid;
    }
    $("#options-tometable-main #weekmodeconfig select").html(
      templates.tometable.modals.options.weekselector({
        weekoffsets: weekoffsets,
        weekid: tometableweekid
      })
    );
  })
  .change();
  $("#options-tometable-periods .addbutton").click(function(){
    $("#options-tometable-periods form ol li:last-child").clone().appendTo("#options-tometable-periods form ol");
  });
  $("#options-tometable-periods form").submit(function(e){
    e.preventDefault();
    var periods = [];
    $("#options-tometable-periods").find("li").each(function(period, li){
      periods[period] = [];
      $(li).find("select").each(function(i, tome){
        periods[period][i] = parseInt($(tome).val());
      });
    });
    dbdata.user.update({
      options: {
        tometable: {
          periods: periods
        }
      }
    }, function(){
      loaduserdata(function(){
        bootbox.alert("Your changes have been saved.");
      });
    });
  });
  $("#modal-options-tometable").modal("show");
});
