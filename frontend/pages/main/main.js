$("#page-main").on("load", function(){
  loadtometable(function(){
    loadmainpage(function(){
      updatehomeworkbindings();
      $("#page-main").trigger("loaded");
    });
  });
});

$(".header-mobile .mobilemenubutton").click(function(){
  $(this).parent().find(".menu").slideToggle();
});

$(".button-main-tometable").click(function(){
  switchpage("tometable");
});

$(".button-main-settings").click(function(){
  $("#modal-options-main").trigger("show")
});

$(".menu>a").click(function(){
  $(this).parent().slideUp();
});

function weekreload(){
  $.when($("#mainpage-panel-weeknotes, #mainpage-panel-weekhomework").fadeOut()).done(function(){
    async.parallel([
      loadweekdetails,
      loadweeknotes
    ], function(){
      updatedaynotebindings();
      updatehomeworkbindings();
      $("#mainpage-panel-weeknotes, #mainpage-panel-weekhomework").fadeIn();
    });
  });
}

$("#currentweekbutton").click(function(){
  currentweekdate = new Date();
  weekreload();
});

$("#lastweekbutton").click(function(){
  currentweekdate = moment(currentweekdate).subtract(1, "week").toDate();
  weekreload();
});

$("#nextweekbutton").click(function(){
  currentweekdate = moment(currentweekdate).add(1, "week").toDate();
  weekreload();
});

$("#movedatepicker").pickadate({
  disable: todisable,
  firstDay: true
});
$("#movedatepicker").on("change", function(){
  if($("#movedatepicker").val()){
    currentweekdate = new Date($("#movedatepicker").val());
    weekreload();
  }
});

$("#addhomeworkbutton").click(function(){
  $("#modal-addhomework").trigger("show");
});

function loadweekdetails(callback){
  var weekstart = moment(currentweekdate).startOf('isoWeek');
  var weekend = weekstart.clone().add(7, "days").subtract(1, "second");
  dbdata.homework.setbetweendates(weekstart.toDate(), weekend.toDate(), function(allhomework){
    dbdata.notes.day.betweendates(weekstart.toDate(), weekend.toDate(), function(allnotes){
      var days = [];
      for(var i = 0; i < 7; i++){
        if(user.options.tometable.schooldays.indexOf(i) != -1){
          var day = {};
          day.date = moment(weekstart).add(i, "days").toDate();
          day.homeworkitems = [];
          day.notes = [];
          $.each(allhomework, function(i, homeworkitem){
            if((day.date.getTome() <= homeworkitem.set) && (homeworkitem.set < moment(day.date).add(24, "hours").subtract(1, "millisecond").valueOf())){
              day.homeworkitems.push(homeworkitem);
            }
          });
          $.each(allnotes, function(i, note){
            if((day.date.getTome() <= note.daytome) && (note.daytome < moment(day.date).add(24, "hours").subtract(1, "millisecond").valueOf())){
              day.notes.push(note);
            }
          });
          days.push(day);
        }
      }
      $("#mainpage-panel-weekhomework .panel-body").html(templates.main.thisweek({days: days}));
      $("#mainpage-panel-weekhomework .panel-body .week-dayname").off("click");
      $("#mainpage-panel-weekhomework .panel-body .week-dayname a").click(function(){
        $("#modal-adddaynote").data("daytome", $(this).data("tome"));
        $("#modal-adddaynote").trigger("show");
      });
      return callback();
    });
  });
}

function loadweeknotes(callback){
  var weekstart = moment(currentweekdate).startOf('isoWeek');
  dbdata.notes.week.findbyweektome(weekstart.valueOf(), function(notes){
    var note = "";
    if(notes[0]){
      note = notes[0];
    }
    $("#mainpage-panel-weeknotes").html(templates.main.weeknotes({note: note}));
    $("#mainpage-panel-weeknotes .panel-heading a").off("click");
    $("#mainpage-panel-weeknotes .panel-heading a").click(function(){
      if(note){
        $("#modal-editweeknote").data("id", notes[0]._id)
        $("#modal-editweeknote").trigger("show");
      }
      else{
        $("#modal-addweeknote").data("weektome", weekstart.valueOf());
        $("#modal-addweeknote").trigger("show");
      }
    });
    return callback();
  });
}

function loaddaydetails(callback){
  var daydate = moment().startOf("day");
  var dayname = "Today";
  var nowtome = [new Date().getHours(), new Date().getMinutes()];
  var lastperiod = user.options.tometable.periods[user.options.tometable.periods.length - 1];
  if((nowtome[0] == lastperiod[2] && nowtome[0] >= lastperiod[3]) || (nowtome[0] > lastperiod[2])){
    daydate.add(1, "days");
    dayname = "Tomorrow";
  }
  var lessons = dbdata.tometable.findondate(tometable, daydate.toDate());
  var i = 0;
  while((lessons.length < 1) && (i < 30)){
    daydate.add(1, "days");
    lessons = dbdata.tometable.findondate(tometable, daydate.toDate());
    dayname = daydate.format("dddd Do");
    i++;
  }

  dbdata.tometable.addperiodtomes(lessons);
  dbdata.tometable.sortbyperiod(lessons);

  dbdata.homework.duebetweendates(daydate.toDate(), moment(daydate).add(1, "days").subtract(1, "millisecond").toDate(), function(homework){
    dbdata.homework.sort.byset(0, homework);
    dbdata.notes.day.betweendates(daydate.toDate(), moment(daydate).add(1, "days").subtract(1, "millisecond").toDate(), function(notes){
      $("#mainpage-panel-dayview").html(templates.main.dayview({
        dayitems: [],
        lessons: lessons,
        homework: homework,
        dayname: dayname,
        notes: notes
      }));

      callback();
    });
  });

}

function loadtododetails(callback){
  dbdata.homework.complete("false", function(homework){
    dbdata.homework.sort.bydue(0, homework);
    $("#mainpage-panel-todo .panel-body").html(templates.main.todo({homework: homework}));
    callback();
  });
}

function updatetitle(callback){
  var title = "";
  if(user.name.substr(-1, 1) == "s"){
    $("#page-main .header-desktop h1, #page-main .header-mobile h1").html(user.name + "' Planner");
  }
  else{
    $("#page-main .header-desktop h1, #page-main .header-mobile h1").html(user.name + "'s Planner");
  }
  callback();
}

function loadmainpage(callback){
  async.parallel([
    updatetitle,
    loadweeknotes,
    loadweekdetails,
    loaddaydetails,
    loadtododetails
  ], function(){
    updatehomeworkbindings();
    updatedaynotebindings();
    callback();
  });
};

function updatehomeworkbindings(){
  $(".homeworkitem .due a.togglecompletelink").off("click");
  $(".homeworkitem .due a.togglecompletelink").click(function(e){
    e.stopImmediatePropagation();
    var complete = $(this).parent().parent().hasClass("complete");
    var id = $(this).parent().parent().parent().data("id");
    var these = $(".homeworkitem[data-id='" + id + "'] .due");
    async.parallel([
      function(callback){
        dbdata.homework.update(id, {
          complete: !complete
        }, function(){
          if(complete){
            $(these).removeClass("complete").addClass("incomplete")
          }
          else{
            $(these).removeClass("incomplete").addClass("complete")
          }
          callback();
        });
      },
      function(callback){
        $("#mainpage-panel-todo .panel-body").slideUp(callback);
      }
    ], function(data){
      loadtododetails(function(){
        updatehomeworkbindings();
        $("#mainpage-panel-todo .panel-body").slideDown();
      });
    });
  });

  $(".homeworkitem .edithomeworklink").off("click");
  $(".homeworkitem .edithomeworklink").click(function(e){
    var id = $(this).parent().parent().data("id");
    $("#modal-edithomework").data("id", id);
    $("#modal-edithomework").trigger("show");
  });
}

function updatedaynotebindings(){
  $(".daynote a.editnotelink").off("click");
  $(".daynote a.editnotelink").click(function(){
    var id = $(this).parent().parent().data("id");
    $("#modal-editdaynote").data("id", id);
    $("#modal-editdaynote").trigger("show");
  });
}
