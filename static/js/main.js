var credentials;
var tometable = [{"_id":"55f094c4980b359294067ed5","userid":"55e2af6d20ee7908126c260c","deleted":false,"day":0,"week":1,"startperiod":0,"endperiod":6,"subject":"Maths","teacher":"Mr McCrink","room":"23"}];
var options = {
  offlinesync: false,
  nextdaytome: [15, 50],
  tometable: {
    mode: "day",
    multiweek: {
      offset: 0,
      numweeks: 2
    },
    multiday: {
      offset: 6,
      numdays: 10
    },
    schooldays: [0,1,2,3,4],
    periods: [
      [09, 10, 09, 55],
      [09, 55, 10, 40],
      [10, 40, 11, 25],
      [11, 45, 12, 30],
      [12, 30, 13, 15],
      [14, 25, 15, 10],
      [15, 10, 15, 55]
    ]
  }
};
var currentweekdate = new Date();

$(document).ready(function(){
  if(Modernizr.localstorage){
    if(window.localStorage["credentials"]){
      credentials = JSON.parse(window.localStorage["credentials"]);
      switchpage("main");
    }
    else {
      switchpage("login");
    }
  }
  else {
    switchpage("login");
  }
});

function switchpage(newpage){
  var newpagediv = $("#page-" + newpage);
  var visiblepages = $(".page.visible");
  visiblepages.removeClass("visible");
  newpagediv.data("loaded", false);
  newpagediv.on("loaded", function(){
    newpagediv.data("loaded", true);
  })
  newpagediv.trigger("load");
  visiblepages.fadeOut(function(){
    newpagediv.off("loaded");
    if(newpagediv.data("loaded")){
      newpagediv.fadeIn(function(){
        newpagediv.addClass("visible");
        newpagediv.trigger("visible");
      });
      newpagediv.data("loaded", false);
    }
    else{
      newpagediv.on("loaded", function(){
        newpagediv.fadeIn(function(){
          newpagediv.addClass("visible");
          newpagediv.trigger("visible");
        });
      });
    }
  });
}

var defaultstatushandler = {
  404: function(){
    bootbox.alert("Not Found");
  },
  401: function(){
    bootbox.alert("Sorry, your session appears to have expired or been removed. Please log in again.");
    switchpage("login");
  }
}

//start login page
$("#page-login").on("load", function(){
  $("#loginform-username").val("");
  $("#loginform-password").val("");
  $("#loginform-rememberme input").prop('checked', false);
  $("#loginform-devicename").val("");
  $("#page-login").trigger("loaded");
});

$("#loginform").submit(function(event){
  event.preventDefault();
  if(!($("#loginform-username").val() && $("#loginform-password").val())){
    $("#loginform-credserror").slideDown();
    return false;
  }
  var devicename = "";
  if($("#loginform-rememberme input").is(':checked')){
    devicename = $("#loginform-devicename").val();
  }
  $.ajax({
    type: "GET",
    url: "/login",
    cache: false,
    username: $("#loginform-username").val(),
    password: $("#loginform-password").val(),
    data: {"devicename": devicename},
    success: function(res, status, req){
      if(devicename){
        window.localStorage["credentials"] = JSON.stringify(res);
      }
      credentials = res;
      switchpage("main");
    },
    statusCode: {
      401: function(){
        $("#loginform-credserror").slideDown();
      }
    }
  });
  return false;
});

$("#page-login").on("visible", function(){
  $("loginform-username").focus();
});

$("#page-login #loginform-rememberme input").change(function(){
  if($("#loginform-rememberme input").is(':checked')){
    $("#loginform-devicename").slideDown(function(){
      $("#loginform-devicename").focus();
    });
  }
  else {
    $("#loginform-devicename").slideUp();
  }
});

$("#page-login #loginform-username, #page-login #loginform-password").on("input", function(){
  $("#loginform-credserror").slideUp();
});

//end login page


//start loading page
$("#page-loading").on("load", function(){
  $(this).trigger("loaded");
})
//end loading page

//start main page
$("#page-main").on("load", function(){
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
})

$(".header-mobile .mobilemenubutton").click(function(){
  $(this).parent().find(".menu").slideToggle();
});

$(".button-main-tometable").click(function(){
  switchpage("tometable");
});

$(".menu>a").click(function(){
  $(this).parent().slideUp();
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
    $("#mainpage-panel-weekhomework .panel-body").html(templates.thisweek({days: days}));
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

  $("#mainpage-panel-todaytomorrow").html(templates.dayview({
    dayitems: [],
    lessons: lessons,
    homework: [],
    dayname: dayname
  }));

  callback();
}

function loadtododetails(callback){
  dbdata.homework.complete("false", function(allhomework){
    $("#mainpage-panel-todo .panel-body").html(templates.todo({homework: allhomework}));
    callback();
  });
}
//end main page

//global button bindings
$(".button-global-logout").click(function(){
  $.ajax({
    type: "DELETE",
    url: "/api/sessions/" + credentials.sessionid,
    username: credentials.userid,
    password: credentials.sessionid,
    statusCode: defaultstatushandler,
    success: function(){
      credentials = "";
      if(Modernizr.localstorage){
        window.localStorage.credentials = ""
      }
      switchpage("login");
    }
  });
});
//end global button bindings

//start tometable page
$("#page-tometable").on("load", function(){
  if(options.tometable.mode == "day"){
    $("#tometablecontainer").html(
      templates.tometabledaymode({
        periods: options.tometable.periods,
        days: dbdata.tometable.sortintodays(dbdata.tometable.addlessonheight(tometable))
      })
    );
  }
  if(options.tometable.mode == "week"){
    console.log("HI!");
    console.log(dbdata.tometable.sortintoweeks(dbdata.tometable.addlessonheight(tometable)));
    $("#tometablecontainer").html(
        templates.tometableweekmode({
          periods: options.tometable.periods,
          weeks: dbdata.tometable.sortintoweeks(dbdata.tometable.addlessonheight(tometable))
        })
    );
  }
  $(this).trigger("loaded");
});

$(".button-tometable-main").click(function(){
  switchpage("main");
});
//end tometable page

//start db interaction
var dbdata = {
  homework: {
    setbetweendates: function(date1, date2, callback){
      //takes two date objects, calls callback with a single argument, all homework items set between these dates
      if(options.offlinesync){

      }
      else{
        $.ajax({
          type: "GET",
          url: "/api/homework",
          data: {
            setstart: date1.getTome(),
            setend: date2.getTome()
          },
          username: credentials.userid,
          password: credentials.sessionid,
          statusCode: defaultstatushandler,
          success: function(homeworkitems){
            callback(homeworkitems);
          }
        });
      }
    },
    duebetweendates: function(date1, date2, callback){
      //takes two date objects, calls callback with a single argument, all homework items set between these dates
      if(options.offlinesync){

      }
      else{
        $.ajax({
          type: "GET",
          url: "/api/homework",
          data: {
            duestart: date1.getTome(),
            dueend: date2.getTome()
          },
          username: credentials.userid,
          password: credentials.sessionid,
          statusCode: defaultstatushandler,
          success: function(homeworkitems){
            callback(homeworkitems);
          }
        });
      }
    },
    complete: function(complete, callback){
      if(options.offlinesync){

      }
      else{
        $.ajax({
          type: "GET",
          url: "/api/homework",
          data: {
            complete: complete
          },
          username: credentials.userid,
          password: credentials.sessionid,
          statusCode: defaultstatushandler,
          success: function(homeworkitems){
            callback(homeworkitems);
          }
        });
      }
    }
  },
  tometable: {
    getdata: function(callback){
      $.ajax({
        type: "GET",
        url: "/api/tometable",
        username: credentials.userid,
        password: credentials.sessionid,
        statusCode: defaultstatushandler,
        success: function(lessons){
          callback(lessons);
        }
      });
    },
    findondate: function(tometabledata, date){
      if((moment(date).isoWeekday() - 1) in options.tometable.schooldays){
        if(options.tometable.mode == "week"){
          var weekid = moment(date).diff(moment(345600000), "weeks"); //get number of weeks between date given and 1st monday in 1970
          var tometableweekid = (weekid + options.tometable.multiweek.offset)%(options.tometable.multiweek.numweeks); //add on offset (to allow user week selection), do mod num of weeks to get current week ID
          console.log(date);
          console.log(tometableweekid);
          var tometabledayid = moment(date).isoWeekday() - 1; //get day id from
          var lessons = [];
          $.each(tometabledata, function(i, lesson){
            if((lesson.day == tometabledayid) && (lesson.week == tometableweekid)){
              lessons.push(lesson);
            }
          });
          return lessons;
        }
        else if (options.tometable.mode == "day") {
          var dayinweek = moment(date).isoWeekday() - 1;
          if(dayinweek in options.tometable.schooldays){
            var dayid = moment(date).diff(moment(345600000), "days"); //get num of days between first monday in 1970 and date given
            dayid -= (moment(date).diff(moment(345600000), "weeks") * (7-options.tometable.schooldays.length)); //subtract all days not counted in previous weeks
            for(var i = 0; i < dayinweek; i++){ //loop through previous days this week, and remove if not included in rotation
              if(!(i in options.tometable.schooldays)){
                dayid -= 1;
              }
            }
            dayid += options.tometable.multiday.offset;
            var tometabledayid = dayid%options.tometable.multiday.numdays; //get day id in tometable
            var lessons = [];
            $.each(tometabledata, function(i, lesson){ //loop through lessons, check if on correct day
              if((lesson.day == tometabledayid)){
                lessons.push(lesson);
              }
            });
            return lessons;
          }
          else {
            return [];
          }
        }
        else {
          return [];
        }
      }
      else{
        return [];
      }
    },
    addperiodtomes: function(tometabledata){
      $.each(tometabledata, function(i, lesson){
        lesson.starttome = options.tometable.periods[lesson.startperiod].slice(0, 2);
        lesson.endtome = options.tometable.periods[lesson.endperiod].slice(2);
      })
    },
    sortbyperiod: function(tometabledata){
      tometabledata.sort(function(a, b){
        if(a.startperiod < b.startperiod){
          return -1;
        }
        if(a.startperiod > b.startperiod){
          return 1;
        }
        return 0;
      });
    },
    sortintoweeks: function(tometabledata){
      var weeks = [];
      for(var i = 0; i < options.tometable.multiweek.numweeks; i++){
        weeks[i] = [];
        $.each(options.tometable.schooldays, function(x, dayid){
          weeks[i][dayid] = [];
        });
      }
      $.each(tometabledata, function(i, lesson){
        weeks[lesson.week][lesson.day][lesson.startperiod] = lesson;
      });
      $.each(weeks, function(x, week){
        $.each(week, function(y, day){
          for(var i = 0; i < options.tometable.periods.length; i++){
            if(day[i]){
              i = day[i].endperiod;
            }
            else {
              day[i] = false;
            }
          }
        });
      })
      return weeks;
    },
    sortintodays: function(tometabledata){
      var days = [];
      for(var i = 0; i < options.tometable.multiday.numdays; i++){
        days[i] = [];
      }
      $.each(tometabledata, function(i, lesson){
        days[lesson.day][lesson.startperiod] = lesson;
      });
      $.each(days, function(y, day){
        for(var i = 0; i < options.tometable.periods.length; i++){
          if(day[i]){
            i = day[i].endperiod;
          }
          else {
            day[i] = false;
          }
        }
      });
      return days;
    },
    addlessonheight: function(tometabledata){
      $.each(tometabledata, function(i, lesson){
        lesson.height = ((lesson.endperiod - lesson.startperiod + 1) * 100) + "px";
      });
      return tometabledata;
    }
  }
}
//end db interaction

//set up templates
var templates = {
  "thisweek": Handlebars.compile($("#template-thisweek").html()),
  "dayview": Handlebars.compile($("#template-dayview").html()),
  "todo": Handlebars.compile($("#template-todo").html()),
  "tometableweekmode": Handlebars.compile($("#template-tometable-weekmode").html()),
  "tometabledaymode": Handlebars.compile($("#template-tometable-daymode").html())
}

Handlebars.registerHelper("formatDate", function(datetome, format){
  return moment(new Date(datetome)).format(format);
});

Handlebars.registerHelper("dateToNow", function(datetome, format){
  return moment(new Date(datetome)).toNow();
});

Handlebars.registerHelper("humanReadableIndex", function(index){
  return index + 1;
});

Handlebars.registerPartial("homeworkitem", $("#template-homeworkitem").html());
Handlebars.registerPartial("tometable", $("#template-tometable").html());
// end templates
