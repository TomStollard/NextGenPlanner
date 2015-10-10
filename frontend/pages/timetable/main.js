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
    locations.push(lesson.location);
  });
  var nextperiod = 0;
  var nextday = 0;
  var nextweek = 0;
  var lastlesson = dbdata.tometable.getlastlesson(tometable);
  nextperiod = lastlesson.endperiod + 1;
  if(nextperiod >= options.tometable.periods.length){
    nextperiod = 0;
    nextday = lastlesson.day + 1;
  }
  else{
    nextday = lastlesson.day;
  }
  if(nextday >= options.tometable.schooldays.length){
    nextday = 0;
    nextweek = lastlesson.week + 1;
  }
  else{
    nextweek = lastlesson.week;
  }
  if(nextweek >= options.tometable.multiweek.numweeks){
    nextweek = 0;
  }
  $("#modal-addlesson").html(
    templates.tometable.modals.addlesson.main({
      periods: options.tometable.periods,
      days: options.tometable.schooldays,
      weekmode: Boolean(options.tometable.mode == "week"),
      numweeks: options.tometable.multiweek.numweeks,
      defaultperiod: nextperiod,
      defaultday: nextday,
      defaultweek: nextweek
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
          location = lesson.location;
        }
      });
      $("#modal-addlesson input[name='teacher']").val(teacher);
    })
    .focus();

    $("#modal-addlesson input[name='teacher']").autocomplete({
      lookup: teachers,
      onHint: function(hint){
        $("#modal-addlesson input[name='teacher-suggest']").val(hint);
      },
      onSelect: function(){
        $(this).change();
      }
    }).change(function(){
      var location = "";
      $.each(tometable, function(i, lesson){
        if(lesson.subject == $("#modal-addlesson input[name='subject']").val() && lesson.teacher == $("#modal-addlesson input[name='teacher']").val()){
          location = lesson.location;
        }
      });
      if(location){
        $("#modal-addlesson input[name='location']").val(location);
      }
      else{
        $.each(tometable, function(i, lesson){
          if(lesson.subject == $("#modal-addlesson input[name='subject']").val()){
            location = lesson.location;
          }
        });
        $("#modal-addlesson input[name='location']").val(location);
      }
    });
  })
  .modal("show");

  $("#modal-addlesson form").submit(function(e){
    e.preventDefault();
    console.log({
      subject: $("#modal-addlesson form input[name='subject']").val(),
      teacher: $("#modal-addlesson form input[name='techer']").val(),
      location: $("#modal-addlesson form input[name='location']").val(),
      startperiod: $("#modal-addlesson form select[name='startperiod']").val(),
      day: $("#modal-addlesson form select[name='day']").val(),
      week: (parseInt($("#modal-addlesson form input[name='week']").val()) - 1)
    });
  });
});
