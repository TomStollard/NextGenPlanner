Handlebars.registerHelper("formatDate", function(datetome, format){
  if(datetome){
    return moment(new Date(datetome)).format(format);
  }
  else{
    return moment(new Date()).format(format);
  }
});

Handlebars.registerHelper("dateToNow", function(datetome){
  return moment(new Date(datetome)).fromNow();
});

Handlebars.registerHelper("dateCalendar", function(datetome){
  return moment(datetome).calendar(null, {
    sameDay: "[Today]",
    nextDay: "[Tomorrow]",
    nextWeek: "[Next] dddd",
    lastDay: "[Yesterday]",
    lastWeek: "[Last] dddd",
    sameElse : "Do MMM"
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
