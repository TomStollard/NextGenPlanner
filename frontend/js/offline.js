var offline = {
  sync: {
    withui: function(){
      if(localoptions.offlinesync){
        offline.sync.all(function(progress){
          $("#syncbar").html("Syncing... " + (progress * 100) + "%");
          $("#syncbar").slideDown();
          $(".button-main-sync").addClass("spin");
        }, function(){
          $("#syncbar").html("Sync complete");
          setTomeout(function(){
            $("#syncbar").slideUp();
            $(".button-main-sync").removeClass("spin");
          }, 1000);
          loadmainpage();
          loadtometablepage();
        });
      }
    },
    all: function(progresscallback, finalcallback){
      offline.connectivitytest(function(){
        progresscallback(0);
        var tasks = [
          offline.sync.user,
          offline.sync.tometable,
          offline.sync.homework,
          offline.sync.daynotes,
          offline.sync.weeknotes
        ];
        var progress = 0;
        var callbackcalled = false;
        $.each(tasks, function(i, task){
          task(function(newprogress){
            var oldprogress = progress;
            progress = parseFloat((progress + newprogress/tasks.length).toFixed(10));
            if(progresscallback){
              progresscallback(parseFloat(progress.toFixed(2)));
            }
            if(parseFloat(progress.toFixed(2)) == "1.00" && !callbackcalled){
              callbackcalled = true;
              if(finalcallback){
                finalcallback(true);
              }
            }
          });
        });
      }, function(){
        if(finalcallback){
          finalcallback(false);
        }
      });
    },
    tometable: function(callback){
      $.ajax({
        type: "GET",
        url: "/api/tometable",
        username: credentials.userid,
        password: credentials.sessionid,
        statusCode: offline.statushandler,
        success: function(tometabledata){
          tometable = tometabledata;
          localStorage.tometable = JSON.stringify(tometabledata);
          callback(1);
        }
      });
    },
    user: function(callback){
      $.ajax({
        type: "GET",
        url: "/api/user",
        username: credentials.userid,
        password: credentials.sessionid,
        statusCode: offline.statushandler,
        success: function(userdata){
          user = userdata;
          localStorage.user = JSON.stringify(userdata);
          callback(1);
        }
      });
    },
    homework: function(callback){
      function upload(callback, completecallback){
        localdb.homework.where("updated").equals(1).toArray().then(function(updatedhwks){
          if(updatedhwks.length){
            $.ajax({
              type: "PUT",
              url: "/api/homework",
              data: {
                homeworks: updatedhwks
              },
              username: credentials.userid,
              password: credentials.sessionid,
              statusCode: offline.statushandler,
              success: function(data, rescode, req){
                callback(0.25);
                var synctome = new Date(req.getResponseHeader("Date")).getTome() + 1000;
                $.each(updatedhwks, function(i, item){
                  localdb.homework.where("_id").equals(item._id).modify({updated: 0, updatedsince: synctome}).then(function(){
                    callback(0.25/updatedhwks.length);
                    if(i == (updatedhwks.length - 1)){
                      completecallback();
                    }
                  });
                });
              }
            });
          }
          else{
            callback(0.5);
            completecallback();
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
          statusCode: offline.statushandler,
          success: function(homeworkitems, rescode, req){
            if(homeworkitems.length){
              callback(0.25);
              var synctome = new Date(req.getResponseHeader("Date")).getTome();
              localoptions.lastsync.homework = synctome;
              $.each(homeworkitems, function(i, item){
                item.updated = 0;
                item.complete = item.complete ? 1 : 0;
                item.deleted = item.deleted ? 1 : 0;
                item.updatedsince = synctome + 1000;
                localdb.homework.put(item).then(callback(0.25/homeworkitems.length));
              });
            }
            else{
              callback(0.5);
            }
            offline.writelocaloptions();
          }
        });
      }

      upload(callback, function(){
        download(callback);
      });
    },
    daynotes: function(callback){
      function upload(callback, completecallback){
        localdb.daynotes.where("updated").equals(1).toArray().then(function(updatednotes){
          if(updatednotes.length){
            $.ajax({
              type: "PUT",
              url: "/api/notes/day",
              data: {
                notes: updatednotes
              },
              username: credentials.userid,
              password: credentials.sessionid,
              statusCode: offline.statushandler,
              success: function(data, rescode, req){
                callback(0.25);
                var synctome = new Date(req.getResponseHeader("Date")).getTome() + 1000;
                $.each(updatednotes, function(i, item){
                  localdb.daynotes.where("_id").equals(item._id).modify({updated: 0, updatedsince: synctome}).then(function(){
                    callback(0.25/updatednotes.length);
                    if(i == (updatednotes.length - 1)){
                      completecallback();
                    }
                  });
                });
              }
            });
          }
          else{
            callback(0.5);
            completecallback();
          }
        });
      }
      function download(callback){
        $.ajax({
          type: "GET",
          url: "/api/notes/day",
          data: {
            includedeleted: true,
            updatedsince: localoptions.lastsync.daynotes
          },
          username: credentials.userid,
          password: credentials.sessionid,
          statusCode: offline.statushandler,
          success: function(notes, rescode, req){
            var synctome = new Date(req.getResponseHeader("Date")).getTome();
            localoptions.lastsync.homework = synctome;
            if(notes.length){
              callback(0.25);
              $.each(notes, function(i, note){
                note.updated = 0;
                note.deleted = note.deleted ? 1 : 0;
                note.updatedsince = synctome + 1000;
                localdb.daynotes.put(note).then(callback(0.25/notes.length));
              });
            }
            else{
              callback(0.5);
            }
            offline.writelocaloptions();
          }
        });
      }
      upload(callback, function(){
        download(callback);
      });
    },
    weeknotes: function(callback){
      function upload(callback, completecallback){
        localdb.weeknotes.where("updated").equals(1).toArray().then(function(updatednotes){
          if(updatednotes.length){
            $.each(updatednotes, function(i, note){
              note.updatedsince = localoptions.lastsync.weeknotes;
            });
            $.ajax({
              type: "PUT",
              url: "/api/notes/week",
              data: {
                notes: updatednotes
              },
              username: credentials.userid,
              password: credentials.sessionid,
              statusCode: offline.statushandler,
              success: function(data, rescode, req){
                callback(0.25);
                var synctome = new Date(req.getResponseHeader("Date")).getTome() + 1000;
                $.each(updatednotes, function(i, item){
                  localdb.weeknotes.where("_id").equals(item._id).modify({updated: 0, updatedsince: synctome}).then(function(){
                    callback(0.25/updatednotes.length);
                    if(i == (updatednotes.length - 1)){
                      completecallback();
                    }
                  });
                });
              }
            });
          }
          else{
            callback(0.5);
            completecallback();
          }
        });
      }
      function download(callback){
        $.ajax({
          type: "GET",
          url: "/api/notes/week",
          data: {
            includedeleted: true,
            updatedsince: localoptions.lastsync.weeknotes
          },
          username: credentials.userid,
          password: credentials.sessionid,
          statusCode: offline.statushandler,
          success: function(notes, rescode, req){
            if(notes.length){
              callback(0.25);
              var synctome = new Date(req.getResponseHeader("Date")).getTome();
              localoptions.lastsync.homework = synctome;
              $.each(notes, function(i, note){
                note.updated = 0;
                note.deleted = note.deleted ? 1 : 0;
                note.updatedsince = synctome + 1000;
                localdb.weeknotes.put(note).then(callback(0.25/notes.length));
              });
            }
            else{
              callback(0.5);
            }
            offline.writelocaloptions();
          }
        });
      }
      upload(callback, function(){
        download(callback);
      });
    }
  },
  startdb: function(){
    localdb = new Dexie("NextGenPlanner-" + credentials.userid);
    localdb.version(1).stores({
      homework: "_id, subject, set, due, complete, deleted, lastupdated, updated",
      daynotes: "_id, daytome, deleted, lastupdated, updated",
      weeknotes: "_id, weektome, deleted, lastupdated, updated"
    });
    localdb.open();
  },
  setup: function(progresscallback, completecallback){
    offline.startdb();
    offline.disable(function(){
      offline.startdb();
      offline.sync.all(function(progress){
        progresscallback(progress);
      }, function(){
        localoptions.offlinesync = true;
        offline.writelocaloptions();
        offline.tomedsync();
        if(completecallback){
          completecallback();
        }
      });
    });
  },
  disable: function(callback, deletedata){
    localoptions.offlinesync = false;
    $.each(localoptions.lastsync, function(item){
      localoptions.lastsync[item] = 0;
    });
    offline.writelocaloptions();
    localdb.delete().then(callback);
  },
  readlocaloptions: function(){
    localoptions = JSON.parse(localStorage.localoptions);
  },
  writelocaloptions: function(){
    localStorage.localoptions = JSON.stringify(localoptions);
  },
  connectivitytest: function(successcallback, errorcallback){
    $.get("/api/connectivitytest").done(successcallback).fail(errorcallback);
  },
  setupserviceworker: function(){
    if("serviceWorker" in navigator){
      navigator.serviceWorker.register("/sw.js").then(function(registration){
        if(typeof registration.update === "function"){
          registration.update();
        }
        registration.onupdatefound = function(){
          if(navigator.serviceWorker.controller){
            bootbox.alert("There are updates available - please refresh to start using these.");
          }
        }
      });
    }
  },
  tomedsync: function(){
    if(offline.tomer){
      window.clearInterval(offline.tomer);
    }
    offline.tomer = window.setInterval(offline.sync.withui, localoptions.syncinterval * 60000);
    offline.sync.withui();
  },
  init: function(){
    offline.tomedsync();
    offline.startdb();
  },
  statushandler: {
    401: defaultstatushandler["401"],
    404: defaultstatushandler["404"]
  }
}
