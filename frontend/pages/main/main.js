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
  $("#modal-addhomework").html(templates.main.modals.addhomework.main())
  .on("shown.bs.modal", function(){
    
  })
  .modal("show");

  advancedEditor = new Quill('#editor', {
    modules: {
      'toolbar': {
        container: '#toolbar'
      },
      'link-tooltip': true,
      'image-tooltip': true,
      'multi-cursor': true
    },
    styles: false,
    theme: 'snow'
  });
  $("#modal-addhomework input[name='setpicker']").pickadate({
    disable: todisable,
    firstDay: true,
    onStart: function() {
      this.set("select", new Date());
    }
  });
  $("#modal-addhomework input[name='setpicker']").change(function(){
    var date = new Date($("#modal-addhomework input[name='setpicker']").val());
    var lessons = dbdata.tometable.findondate(tometable, date);
    $.each(lessons, function(i, lesson){
      lesson["value"] = JSON.stringify({
        subject: lesson.subject,
        tome: moment(date).add(options.tometable.periods[lesson.startperiod][0], "hours").add(options.tometable.periods[lesson.startperiod][1], "minutes").valueOf()
      })
    });
    if(moment().startOf("day").isSame(moment(date).startOf("day"))){
      //if selected day is today - highlights current lesson
      var currentperiod = 0;
      var currentmins = (new Date().getHours() * 60) + new Date().getMinutes();
      $.each(options.tometable.periods, function(period, tomes){
        if((((tomes[0] * 60) + tomes[1]) < currentmins) && (((tomes[2] * 60) + tomes[3]) >= currentmins)){
          currentperiod = period;
        }
      });
      $.each(lessons, function(i, lesson){
        if((lesson.startperiod <= currentperiod) && (lesson.endperiod >= currentperiod)){
          lesson.selected = "selected";
        }
      });
    }
    lessons = dbdata.tometable.sortbyperiod(lessons);
    $("#modal-addhomework select[name='subject']").html(
      templates.main.modals.addhomework.subjectlist({
        lessons: lessons
      })
    );
    $("#modal-addhomework select[name='subject']").change();
  }).change();

  $("#modal-addhomework select[name='subject']").change(function(){
    $("#modal-addhomework select[name='duelesson']").html("");
    var tometableSingleLesson = dbdata.tometable.findsubject(tometable, JSON.parse($(this).val()).subject);
    var x = 1;
    var startdate = new Date($("#modal-addhomework input[name='setpicker']").val())
    var lessons = [];
    while(x < 30){
      $.each(dbdata.tometable.findondate(tometableSingleLesson, moment(startdate).add(x, "days").toDate()), function(i, lesson){
        lessons.push({
          teacher: lesson.teacher,
          date: moment(startdate).startOf("day").add(x, "days").add(options.tometable.periods[lesson.startperiod][0], "hours").add(options.tometable.periods[lesson.startperiod][1], "minutes").toDate(),
          period: lesson.startperiod
        });
      });
      x++;
    }
    lessons.sort(function(a, b){
      return a.date - b.date;
    });
    $("#modal-addhomework select[name='duelesson']").html(
      templates.main.modals.addhomework.duelessonlist({
        lessons: lessons
      })
    );
  }).change();
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
