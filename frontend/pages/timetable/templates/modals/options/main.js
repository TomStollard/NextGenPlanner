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
      days: days
    })
  );
  $("#modal-options-tometable").modal("show");
});
