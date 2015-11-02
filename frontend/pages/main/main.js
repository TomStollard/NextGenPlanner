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

$(".menu>a").click(function(){
  $(this).parent().slideUp();
});

$("#movedatepicker").pickadate({
  disable: todisable,
  firstDay: true
});
$("#movedatepicker").on("change", function(){
  if($("#movedatepicker").val()){
    currentweekdate = new Date($("#movedatepicker").val());
    $("#mainpage-panel-weeknotes").fadeOut();
    $("#mainpage-panel-weekhomework").fadeOut(function(){
      loadweekdetails(function(){
        $("#mainpage-panel-weeknotes, #mainpage-panel-weekhomework").fadeIn();
      });
    });
  }
});

function weekreload(){
  $.when($("#mainpage-panel-weeknotes, #mainpage-panel-weekhomework").fadeOut()).done(function(){
    async.parallel([
      loadweekdetails,
      loadweeknotes
    ], function(){
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

$("#addhomeworkbutton").click(function(){
  $("#modal-addhomework").trigger("show");
});

function loadweekdetails(callback){
  var weekstart = moment(currentweekdate).startOf('isoWeek');
  var weekend = weekstart.clone().add(7, "days").subtract(1, "second");
  dbdata.homework.setbetweendates(weekstart.toDate(), weekend.toDate(), function(allhomework){
    var days = [];
    for(var i = 0; i < 7; i++){
      if(i in options.tometable.schooldays){
        var day = {};
        day.date = moment(weekstart).add(i, "days").toDate();
        day.homeworkitems = [];
        $.each(allhomework, function(i, homeworkitem){
          if((day.date.getTome() < homeworkitem.set) && (homeworkitem.set < moment(day.date).add(24, "hours").subtract(1, "millisecond").valueOf())){
            day.homeworkitems.push(homeworkitem);
          }
        });
        days.push(day);
      }
    }
    $("#mainpage-panel-weekhomework .panel-body").html(templates.main.thisweek({days: days}));
    
    return callback();
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
  if((nowtome[0] == options.nextdaytome[0] && nowtome[0] >= options.nextdaytome[1]) || (nowtome[0] > options.nextdaytome[0])){
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
    $("#mainpage-panel-todaytomorrow").html(templates.main.dayview({
      dayitems: [],
      lessons: lessons,
      homework: homework,
      dayname: dayname
    }));

    callback();
  });

}

function loadtododetails(callback){
  dbdata.homework.complete("false", function(homework){
    dbdata.homework.sort.bydue(0, homework);
    $("#mainpage-panel-todo .panel-body").html(templates.main.todo({homework: homework}));
    callback();
  });
}

function loadmainpage(callback){
  async.parallel([
    loadweeknotes,
    loadweekdetails,
    loaddaydetails,
    loadtododetails
  ], function(){
    updatehomeworkbindings();
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
