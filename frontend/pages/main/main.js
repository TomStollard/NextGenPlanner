$("#page-main").on("load", function(){
  loadtometable(function(){
    async.parallel([
      function(callback){
        loadweekdetails(callback);
      },
      function(callback){
        loadtododetails(callback);
      },
      function(callback){
        loaddaydetails(callback);
      }
    ], function(){
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
    console.log($("#movedatepicker").val());
    currentweekdate = new Date($("#movedatepicker").val());
    $("#mainpage-panel-weeknotes").fadeOut();
    $("#mainpage-panel-weekhomework").fadeOut(function(){
      loadweekdetails(function(){
        $("#mainpage-panel-weeknotes, #mainpage-panel-weekhomework").fadeIn();
      });
    });
  }
});

$("#currentweekbutton").click(function(){
  currentweekdate = new Date();
  $("#mainpage-panel-weeknotes").fadeOut();
  $("#mainpage-panel-weekhomework").fadeOut(function(){
    loadweekdetails(function(){
      $("#mainpage-panel-weeknotes, #mainpage-panel-weekhomework").fadeIn();
    });
  });
});

$("#lastweekbutton").click(function(){
  currentweekdate = moment(currentweekdate).subtract(1, "week").toDate();
  $("#mainpage-panel-weeknotes").fadeOut();
  $("#mainpage-panel-weekhomework").fadeOut(function(){
    loadweekdetails(function(){
      $("#mainpage-panel-weeknotes, #mainpage-panel-weekhomework").fadeIn();
    });
  });
});

$("#nextweekbutton").click(function(){
  currentweekdate = moment(currentweekdate).add(1, "week").toDate();
  $("#mainpage-panel-weeknotes").fadeOut();
  $("#mainpage-panel-weekhomework").fadeOut(function(){
    loadweekdetails(function(){
      $("#mainpage-panel-weeknotes, #mainpage-panel-weekhomework").fadeIn();
    });
  });
});

$("#addhomeworkbutton").click(function(){
  $("#modal-addhomework").html(templates.main.modals.addhomework()).modal("show");
  $("#modal-addhomework input[name='setpicker']").pickadate({
    disable: todisable,
    firstDay: true
  });
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
          if((day.date.getTome() < homeworkitem.set) && (homeworkitem.set < moment(day.date).add(24, "hours").subtract(1, "second").valueOf())){
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

  $("#mainpage-panel-todaytomorrow").html(templates.main.dayview({
    dayitems: [],
    lessons: lessons,
    homework: [],
    dayname: dayname
  }));

  callback();
}

function loadtododetails(callback){
  dbdata.homework.complete("false", function(allhomework){
    $("#mainpage-panel-todo .panel-body").html(templates.main.todo({homework: allhomework}));
    callback();
  });
}
