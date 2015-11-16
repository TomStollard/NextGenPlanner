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
  })
  $("#modal-options-tometable").html(
    templates.tometable.modals.options.main({
      days: days,
      periods: user.options.tometable.periods
    })
  );
  $("#options-tometable-periods .addbutton").click(function(){
    $("#options-tometable-periods form ol li:last-child").clone().appendTo("#options-tometable-periods form ol");
  });
  $("#options-tometable-periods form").submit(function(e){
    console.log(e);
    e.preventDefault();
    var periods = [];
    $("#options-tometable-periods").find("li").each(function(period, li){
      periods[period] = [];
      $(li).find("select").each(function(i, tome){
        periods[period][i] = parseInt($(tome).val());
      });
    });
    console.log(periods);
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
