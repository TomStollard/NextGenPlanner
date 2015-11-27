var offline = {
  sync: {
    all: function(callback){

    },
    tometable: function(callback){
      $.ajax({
        type: "GET",
        url: "/api/tometable",
        username: credentials.userid,
        password: credentials.sessionid,
        statusCode: defaultstatushandler,
        success: function(tometabledata){
          tometable = tometabledata;
          localStorage.tometable = JSON.stringify(tometabledata);
          callback();
        }
      });
    },
    user: function(callback){
      $.ajax({
        type: "GET",
        url: "/api/user",
        username: credentials.userid,
        password: credentials.sessionid,
        statusCode: defaultstatushandler,
        success: function(userdata){
          user = userdata;
          localStorage.user = JSON.stringify(userdata);
          callback();
        }
      });
    },
    homework: function(callback){
      function upload(callback){
        localdb.homework.where("updated").equals(1).toArray().then(function(updatedhwks){
          if(updatedhwks.length){
            $.each(updatedhwks, function(i, homework){
              homework.updatedsince = localoptions.lastsync.homework;
            });
            $.ajax({
              type: "PUT",
              url: "/api/homework",
              data: {
                homeworks: updatedhwks
              },
              username: credentials.userid,
              password: credentials.sessionid,
              statusCode: defaultstatushandler,
              success: function(){
                localdb.homework.where("updated").equals(1).modify({
                  "updated": 0
                }).then(callback);
              }
            });
          }
          else{
            callback();
          }
        });
      }
      function download(callback){
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
            callback();
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

      upload(function(){
        download(callback);
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
  setup: function(callback){
    offline.startdb();
    async.parallel([
      offline.sync.user,
      offline.sync.tometable,
      offline.sync.homework
    ], function(){
      localoptions.offlinesync = true;
      offline.writelocaloptions();
      if(callback){
        callback();
      }
    });
  },
  readlocaloptions: function(){
    localoptions = JSON.parse(localStorage.localoptions);
  },
  writelocaloptions: function(){
    localStorage.localoptions = JSON.stringify(localoptions);
  }
}
