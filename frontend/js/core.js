var credentials = {};
//var tometable = [{"_id":"55f094c4980b359294067ed5","userid":"55e2af6d20ee7908126c260c","deleted":false,"day":4,"week":0,"startperiod":4,"endperiod":5,"subject":"Maths","teacher":"Mr McCrink","location":"23"}];
var tometable = [];
var editors = {};
var localoptions = {
  offlinesync: false
}
var options = {
  nextdaytome: [15, 50],
  tometable: {
    mode: "week",
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
//calendar disabled dates - read pickaday documentation, passed as argument when initialising (different to .set("enable/disable") when initialised)
//firstDay argument must also be set to true, otherwise week starts on Sun and everything is offset
var todisable = [true];
$.each(options.tometable.schooldays, function(i, day){
  todisable.push(day + 1);
});

$(document).ready(function(){
  loadlocaldata(function(){
    if(credentials.userid){
      loaduserdata(function(){
        switchpage("main");
      });
    }
    else {
      switchpage("login");
    }
  });
});

function switchpage(newpage){
  var newpagediv = $("#page-" + newpage);
  var visiblepages = $(".page.visible");
  $(".page.visible").removeClass("visible");
  newpagediv.data("loaded", false);
  if(visiblepages.length){
    newpagediv.off("loaded");
    newpagediv.on("loaded", function(){
      newpagediv.data("loaded", true);
    });
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
  else{
    newpagediv.on("loaded", function(){
      newpagediv.fadeIn(function(){
        newpagediv.addClass("visible");
        newpagediv.trigger("visible");
      });
    });
    newpagediv.trigger("load");
  }
}

function loadlocaldata(callback){
  if(window.localStorage["credentials"]){
    credentials = JSON.parse(window.localStorage["credentials"]);
  }
  callback();
}

function loaduserdata(callback){
    async.parallel([
      loaduser,
      loadtometable
    ], callback);
}

function loadtometable(callback){
  if(localoptions.offlinesync){
    tometable = JSON.parse(window.localStorage["tometable"]);
  }
  else{
    $.ajax({
      type: "GET",
      url: "/api/tometable",
      username: credentials.userid,
      password: credentials.sessionid,
      statusCode: defaultstatushandler,
      success: function(tometabledata){
        tometable = tometabledata;
        callback();
      }
    });
  }
}

function loaduser(callback){
  if(localoptions.offlinesync){
  }
  else{
    $.ajax({
      type: "GET",
      url: "/api/user",
      username: credentials.userid,
      password: credentials.sessionid,
      statusCode: defaultstatushandler,
      success: function(userdata){
        user = userdata;
        callback();
      }
    });
  }
}



function generateitemid(){
  return uuid.v4() + "-" + new Date().getTome() + "-"+ credentials.sessionid
}

var defaultstatushandler = {
  404: function(){
    bootbox.alert("Error 404: Not Found");
  },
  401: function(){
    switchpage("login");
    bootbox.alert("Sorry, your session appears to have expired or been removed. Please log in again.");
  }
}
