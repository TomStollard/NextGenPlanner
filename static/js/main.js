var credentials;
var options = {
  offlinesync: false
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
    bootbox.alert("Not Found")
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

$("#page-loading").on("load", function(){
  $(this).trigger("loaded");
})

//start main page
$("#page-main").on("load", function(){
  async.parallel([
    function(callback){
      loadweekdetails(callback);
    }
  ], function(){
    $("#page-main").trigger("loaded");
  });
})

$("#page-main .header-mobile #mobilemenubutton").click(function(){
  $("#page-main .header-mobile .menu").slideToggle();
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
  getdbdata.homework.setbetweendates(weekstart.toDate(), weekend.toDate(), function(allhomework){
    var days = [];
    for(var i = 0; i < 7; i++){
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
    $("#mainpage-panel-weekhomework .panel-body").html(templates.thisweek({days: days}));
    return callback();
  });
}

function loadtodaydetails(callback){

}

function loadtododetails(callback){

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

//start db interaction
var getdbdata = {
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
    }
  }
}
//end db interaction

//set up templates
var templates = {
  "thisweek": Handlebars.compile($("#template-thisweek").html()),
  "todaytomorrow": Handlebars.compile($("#template-todaytomorrow").html()),
}

Handlebars.registerHelper("formatDate", function(datetome, format){
  return moment(new Date(datetome)).format(format);
});

Handlebars.registerHelper("tomeLeft", function(duetome){
  var numdays = moment(parseInt(duetome)).diff(moment(new Date()), "days");
  if(numdays == 0){
    return "Due Today";
  }
  else if (numdays == 1){
    return "Due in 1 day";
  }
  else if(numdays > 1){
    return "Due in " + numdays + " days";
  }
  else if (numdays == -1){
    return "Overdue by 1 day";
  }
  else if(numdays < -1){
    return "Overdue by " + (numdays * -1) + " days";
  }
});

Handlebars.registerPartial("homeworkitem", $("#template-homeworkitem").html());
// end templates
