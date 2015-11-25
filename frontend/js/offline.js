var offline = {
  sync: {
    all: function(callback){

    },
    homework: function(callback){
      $.ajax({
        type: "GET",
        url: "/api/homework",
        data: {
          includedeleted: true,
          updatedsince: localoptions.lastsync.homework
        },
        username: credentials.userid,
        password: credentials.sessionid,
        statusCode: defaultstatushandler,
        success: function(homeworkitems, rescode, req){
          $.each(homeworkitems, function(i, item){
            item.updated = 0;
            item.complete = item.complete ? 1 : 0;
            item.deleted = item.deleted ? 1 : 0;
            localdb.homework.put(item);
          });
          localoptions.lastsync.homework = new Date(req.getResponseHeader("Date")).getTome();
          offline.writelocaloptions();
        }
      });
    }
  },
  startdb: function(){
    localdb = new Dexie("NextGenPlanner");
    localdb.version(1).stores({
      homework: "_id, subject, set, due, complete, deleted, lastupdated, updated",
      daynotes: "_id, daytome, deleted, lastupdated, updated",
      weeknotes: "_id, weektome, deleted, lastupdated, updated"
    });
    localdb.open();
  },
  setup: function(){
    localoptions.offlinesync = true;
    offline.writelocaloptions();
  },
  readlocaloptons: function(){
    localoptions = JSON.parse(localStorage.localoptions);
  },
  writelocaloptions: function(){
    localStorage.localoptions = JSON.stringify(localoptions);
  }
}
