Handlebars.registerHelper("formatDate", function(datetome, format){
  return moment(new Date(datetome)).format(format);
});

Handlebars.registerHelper("dateToNow", function(datetome, format){
  return moment(new Date(datetome)).fromNow();
});

Handlebars.registerHelper("humanReadableIndex", function(index){
  return index + 1;
});
