function loadtometablepage(callback){
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
  var subjects = [];
  var teachers = [];
  var locations = [];
  $.each(tometable, function(i, lesson){
    subjects.push(lesson.subject);
    teachers.push(lesson.teacher);
    locations.push(lesson.room);
  });
  console.log(locations);
  $("#modal-addlesson").html(
    templates.tometable.modals.addlesson.main({
      periods: options.tometable.periods,
      days: options.tometable.schooldays,
      weekmode: Boolean(options.tometable.mode == "week"),
      numweeks: options.tometable.multiweek.numweeks
    })
  )
  .on("shown.bs.modal", function(){
    $("#modal-addlesson input[name='subject']").autocomplete({
      lookup: subjects,
      onHint: function(hint){
        $("#modal-addlesson input[name='subject-suggest']").val(hint);
      },
      onSelect: function(){
        $(this).change();
      }
    })
    .change(function(){
      var teacher = "";
      var location = "";
      $.each(tometable, function(i, lesson){
        if(lesson.subject == $("#modal-addlesson input[name='subject']").val()){
          teacher = lesson.teacher;
          location = lesson.room;
        }
      });
      $("#modal-addlesson input[name='teacher']").val(teacher);
      $("#modal-addlesson input[name='location']").val(location);
    })
    .focus();
  })
  .modal("show");
});
