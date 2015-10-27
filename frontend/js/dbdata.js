var dbdata = {
  homework: {
    getbyid: function(id, callback){
      if(options.offlinesync){

      }
      else{
        $.ajax({
          type: "GET",
          url: "/api/homework/" + id,
          username: credentials.userid,
          password: credentials.sessionid,
          statusCode: defaultstatushandler,
          success: callback
        });
      }
    },
    insert: function(id, data, callback){
      if(options.offlinesync){

      }
      else{
        $.ajax({
          type: "POST",
          url: "/api/homework/" + id,
          data: data,
          username: credentials.userid,
          password: credentials.sessionid,
          statusCode: defaultstatushandler,
          success: callback
        });
      }
    },
    update: function(id, data, callback){
      if(options.offlinesync){

      }
      else{
        $.ajax({
          type: "PUT",
          url: "/api/homework/" + id,
          data: data,
          username: credentials.userid,
          password: credentials.sessionid,
          statusCode: defaultstatushandler,
          success: callback
        });
      }
    },
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
      console.log(date1);
      console.log(date2);
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
      //returns all homework that is (in)complete, set first argument as a boolean for complete, second argument is a callback
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
      //get raw data, calls callback with array of lessons
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
      //returns a list of lessons on a specific date, first option is tometable data, second is a JS date object
      if((moment(date).isoWeekday() - 1) in options.tometable.schooldays){
        if(options.tometable.mode == "week"){
          var weekid = moment(date).diff(moment(345600000), "weeks"); //get number of weeks between date given and 1st monday in 1970
          var tometableweekid = (weekid + options.tometable.multiweek.offset)%(options.tometable.multiweek.numweeks); //add on offset (to allow user week selection), do mod num of weeks to get current week ID
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
      //adds period tomes to the data provided
      //warning - this modifies the original object
      $.each(tometabledata, function(i, lesson){
        lesson.starttome = options.tometable.periods[lesson.startperiod].slice(0, 2);
        lesson.endtome = options.tometable.periods[lesson.endperiod].slice(2);
      });
      return tometabledata;
    },
    sortbyperiod: function(tometabledata){
      //orders the tometable data provided (first argument) by date
      //warning - this modifies the original object
      tometabledata.sort(function(a, b){
        if(a.startperiod < b.startperiod){
          return -1;
        }
        if(a.startperiod > b.startperiod){
          return 1;
        }
        return 0;
      });
      return tometabledata;
    },
    sortintoweeks: function(tometabledata){
      //returns an array of weeks, each an array of days, which are then arrays of lessons
      //warning - this modifies the original object
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
          if(day){
            for(var i = 0; i < options.tometable.periods.length; i++){
              if(day[i]){
                i = day[i].endperiod;
              }
              else {
                day[i] = false;
              }
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
      //calculates a lesson height (in pixels, with each lesson 100px high) - modified original array, adds height property to all lessons
      //warning - this modifies the original object
      $.each(tometabledata, function(i, lesson){
        lesson.height = ((lesson.endperiod - lesson.startperiod + 1) * 100) + "px";
      });
      return tometabledata;
    },
    findsubject: function(tometabledata, subject){
      //returns a new array of lessons with only lessons of the specific subject (2nd argument)
      var lessons = [];
      $.each(tometabledata, function(i, lesson){
        if(lesson.subject == subject){
          lessons.push(lesson);
        }
      });
      return lessons;
    },
    getlastlesson: function(tometabledata){
      var max = 0;
      var lastthing;
      $.each(tometabledata, function(i, lesson){
        if(options.tometable.mode == "week"){
          var orderid = (lesson.week * options.tometable.schooldays.length * options.tometable.periods.length) + (lesson.day * options.tometable.periods.length) + (lesson.endperiod);
        }
        else if(options.tometable.mode == "day"){
          var orderid = (lesson.day * options.tometable.periods.length) + (lesson.endperiod);
        }
        if(orderid > max){
          max = orderid;
          lastthing = lesson;
        }
      });
      return lastthing;
    },
    insert: function(data, callback){
      $.ajax({
        type: "POST",
        url: "/api/tometable",
        username: credentials.userid,
        password: credentials.sessionid,
        data: data,
        statusCode: defaultstatushandler,
        success: callback
      });
    },
    update: function(id, data, callback){
      $.ajax({
        type: "PUT",
        url: "/api/tometable/" + id,
        username: credentials.userid,
        password: credentials.sessionid,
        data: data,
        statusCode: defaultstatushandler,
        success: callback
      });
    },
    delete: function(id, callback){
      $.ajax({
        type: "DELETE",
        url: "/api/tometable/" + id,
        username: credentials.userid,
        password: credentials.sessionid,
        statusCode: defaultstatushandler,
        success: callback
      });
    },
    findbyid: function(tometabledata, id){
      var found;
      $.each(tometabledata, function(i, lesson){
        if(lesson._id == id){
          found = lesson;
        }
      });
      return found;
    }
  }
}
