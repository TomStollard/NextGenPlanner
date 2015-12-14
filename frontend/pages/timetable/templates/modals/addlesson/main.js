$("#modal-addlesson").on("show", function(){
  offline.connectivitytest(function(){
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
    if(lastlesson){
      nextperiod = lastlesson.endperiod + 1;
      if(nextperiod >= user.options.tometable.periods.length){
        nextperiod = 0;
        nextday = lastlesson.day + 1;
      }
      else{
        nextday = lastlesson.day;
      }
      if(user.options.tometable.mode == "week"){
        if(nextday >= user.options.tometable.schooldays.length){
          nextday = 0;
          nextweek = lastlesson.week + 1;
        }
        else{
          nextweek = lastlesson.week;
        }
        if(nextweek >= user.options.tometable.multiweek.numweeks){
          nextweek = 0;
        }
      }
      else if(user.options.tometable.mode == "day"){
        if(nextday >= user.options.tometable.multiday.numdays){
          nextday = 0;
        }
      }
    }
    if(user.options.tometable.mode == "week"){
      var days = user.options.tometable.schooldays
    }
    else if(user.options.tometable.mode == "day"){
      var days = [];
      for(var i = 0; i < user.options.tometable.multiday.numdays; i++){
        days.push(i);
      }
    }
    $("#modal-addlesson").html(
      templates.tometable.modals.addlesson.main({
        periods: user.options.tometable.periods,
        days: days,
        weekmode: Boolean(user.options.tometable.mode == "week"),
        numweeks: user.options.tometable.multiweek.numweeks,
        defaultperiod: nextperiod,
        defaultday: nextday,
        defaultweek: nextweek
      })
    )
    .off("shown.bs.modal")
    .on("shown.bs.modal", function(){
      $("#modal-addlesson input[name='subject']").autocomplete({
        lookup: subjects.filter(function(elem, pos) {return subjects.indexOf(elem) == pos}),
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
        $("#modal-addlesson input[name='teacher']").change();
      })
      .focus();

      $("#modal-addlesson input[name='teacher']").autocomplete({
        lookup: teachers.filter(function(elem, pos) {return teachers.indexOf(elem) == pos}),
        onHint: function(hint){
          $("#modal-addlesson input[name='teacher-suggest']").val(hint);
        },
        onSelect: function(){
          $(this).change();
        }
      })
      .change(function(){
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

      $("#modal-addlesson input[name='location']").autocomplete({
        lookup: locations.filter(function(elem, pos) {return locations.indexOf(elem) == pos}),
        onHint: function(hint){
          $("#modal-addlesson input[name='location-suggest']").val(hint);
        },
        onSelect: function(){
          $(this).change();
        }
      })

      $("#modal-addlesson form select[name='startperiod']").change(function(){
        $("#modal-addlesson form select[name='endperiod']").val(parseInt($("#modal-addlesson form select[name='startperiod']").val()));
        $("#modal-addlesson form select[name='endperiod']>option").each(function(i, option){
          if(parseInt($(option).attr("value")) < parseInt($("#modal-addlesson form select[name='startperiod']").val())){
            $(option).attr("disabled", "disabled");
          }
          else{
            $(option).removeAttr("disabled");
          }
        });
      })
      .change();
    })
    .modal("show");

    $("#modal-addlesson form")
    .off("submit")
    .submit(function(e){
      e.preventDefault();
      dbdata.tometable.insert(
        {
        subject: $("#modal-addlesson form input[name='subject']").val(),
        teacher: $("#modal-addlesson form input[name='teacher']").val(),
        location: $("#modal-addlesson form input[name='location']").val(),
        startperiod: $("#modal-addlesson form select[name='startperiod']").val(),
        endperiod: $("#modal-addlesson form select[name='endperiod']").val(),
        day: $("#modal-addlesson form select[name='day']").val(),
        week: (parseInt($("#modal-addlesson form input[name='week']").val()) - 1)
        },
        function(tometabledata){
          $("#modal-addlesson").modal("hide");
          reloadtometable(function(){
            $("#tometablecontainer").fadeOut(function(){
              loadtometablepage(function(){
                $("#tometablecontainer").fadeIn();
              })
            });
          });
        }
      );
    });
  }, function(){
    bootbox.alert("Sorry, you need to be online to modify your tometable.");
  });
});
