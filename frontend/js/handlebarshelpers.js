Handlebars.registerHelper("formatDate", function(datetome, format){
  if(datetome){
    return moment(new Date(datetome)).format(format);
  }
  else{
    return moment(new Date()).format(format);
  }
});

Handlebars.registerHelper("dateToNow", function(datetome){
  var daydiff = moment(datetome).startOf("day").diff(moment().startOf("day"), "days");
  //if date is yesterday, today, or tomorrow, use moment function, otherwise return number of days
  if(daydiff >= -1 && daydiff <= 1){
    return moment(new Date(datetome)).fromNow();
  }
  else{
    if(daydiff < 0){
      return (-daydiff) + " days ago";
    }
    else{
      return "in " + daydiff + " days";
    }
  }
});

Handlebars.registerHelper("json", function(data){
  return JSON.stringify(data);
});

Handlebars.registerHelper("dateCalendar", function(datetome){
  return moment(datetome).calendar(null, {
    sameDay: "[Today]",
    nextDay: "[Tomorrow]",
    nextWeek: "[Next] dddd",
    lastDay: "[Yesterday]",
    lastWeek: "[Last] dddd",
    sameElse : "ddd Do MMM"
  });
});

Handlebars.registerHelper("humanReadableIndex", function(index){
  return index + 1;
});

Handlebars.registerHelper("dayName", function(index){
  return ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][index];
});

Handlebars.registerHelper("ifeq", function(a, b, options){
  if(a == b){
    return options.fn(this);
  }
  else{
    return options.inverse(this);
  }
});

Handlebars.registerHelper("ifnoteq", function(a, b, options){
  if(a != b){
    return options.fn(this);
  }
  else{
    return options.inverse(this);
  }
});

Handlebars.registerHelper('for', function(from, to, block) {
    var output = "";
    for(var i = from; i <= to; i++){
      output += block.fn(i);
    }
    return output;
});

Handlebars.registerHelper('doubleDigit', function(value) {
    return ("0" + value.toString()).slice(-2);
});
