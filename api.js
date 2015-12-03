module.exports = function(db){
  var express = require("express");
  var router = express.Router();
  var basicAuth = require("basic-auth");
  var crypto = require("crypto");
  var uuid = require("node-uuid");


  function unauthorised(res){
    res.set('WWW-Authenticate', 'Basic realm=API Auth Required');
    return res.sendStatus(401);
  }

  router.use(function(req, res, next){
    //AUTH
    //proccesses basic auth
    var basicauthdetails = basicAuth(req);
    if(!basicauthdetails || !basicauthdetails.name || !basicauthdetails.pass){
      return unauthorised(res);
    }
    else
    {
      req.auth = {
        userid: basicauthdetails.name,
        sessionid: basicauthdetails.pass
      };
      return next();
    }
  });

  router.use(function(req, res, next){
    //AUTH
    //checks sessionid matches username
    db.sessions.findOne({
      userid: req.auth.userid,
      _id: req.auth.sessionid
    }, function(err, session){
      //check if a session was found and if it is valid
      if(session){
        if((session.expiry == 0) || (session.expiry > Date.now())){
          if(session.expiry > Date.now()){
            //if session is browser-based, update expiry tome
            db.sessions.update({
              _id: session._id
            }, {
              $set: {
                expiry: Date.now() + 600000
              }
            });
          }
          return next();
        }
        else {
          return unauthorised(res);
        }
      }
      else {
        return unauthorised(res);
      }
    });
  });

  router.use(function(req, res, next){
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');
    next();
  });

  router.route("/user")
    .get(function(req, res){
      db.users.findOne({
        _id: db.ObjectId(req.auth.userid)
      }, function(err, user){
        delete user.password;
        delete user.salt;
        res.json(user);
      })
    })
    .put(function(req, res){
      var updates = {};
      if(req.body.name){
        updates.name = req.body.name
      }
      if(req.body.email){
        updates.email = req.body.email
      }
      if(req.body.password){
        var salt = crypto.randomBytes(32).toString("hex");
        var password = crypto.pbkdf2Sync(req.body.password, salt, 4096, 64).toString("hex");
        updates.password = password;
        updates.salt = salt;
      }
      if(req.body.options){
        if(req.body.options.tometable){
          if(req.body.options.tometable.mode){
            updates["options.tometable.mode"] = req.body.options.tometable.mode;
          }
          if(req.body.options.tometable.schooldays){
            updates["options.tometable.schooldays"] = [];
            req.body.options.tometable.schooldays.forEach(function(day){
              updates["options.tometable.schooldays"].push(parseInt(day));
            });
          }
          if(req.body.options.tometable.periods){
            updates["options.tometable.periods"] = [];
            req.body.options.tometable.periods.forEach(function(period){
              updates["options.tometable.periods"].push([
                parseInt(period[0]),
                parseInt(period[1]),
                parseInt(period[2]),
                parseInt(period[3])
              ]);
            });
          }
          if(req.body.options.tometable.multiday){
            updates["options.tometable.multiday"] = {
              offset: parseInt(req.body.options.tometable.multiday.offset),
              numdays: parseInt(req.body.options.tometable.multiday.numdays)
            };
          }
          if(req.body.options.tometable.multiweek){
            updates["options.tometable.multiweek"] = {
              offset: parseInt(req.body.options.tometable.multiweek.offset),
              numweeks: parseInt(req.body.options.tometable.multiweek.numweeks)
            };
          }
        }
      }
      db.users.update({
        _id: db.ObjectId(req.auth.userid)
      }, {
        $set: updates
      }, function(err, user){
        delete user.password;
        delete user.salt;
        res.json(user);
      })
    });

  router.route("/sessions")
    .get(function(req, res){
      db.sessions.find({
        userid: req.auth.userid
      }, function(err, sessions){
        res.json(sessions);
      });
    })
    .delete(function(req, res){
      db.sessions.remove({
        userid: req.auth.userid
      }, function(err, numremoved){
        if(numremoved.ok){
          res.sendStatus(200);
        }
        else {
          res.sendStatus(500);
        }
      });
    })
    .post(function(req, res){
      db.sessions.insert({
        userid: req.auth.userid,
        expiry: parseInt(req.body.expiry),
        type: "api",
        description: req.body.description,
        _id: uuid.v4()
      }, function(err, session){
        res.json(session);
      });
    });

  router.route("/sessions/:id")
    .get(function(req, res){
      db.sessions.findOne({
        _id: req.params.id
      }, function(err, session){
        if(session){
          if(session.userid == req.auth.userid){
            res.json(session);
          }
          else {
            unauthorised(res);
          }
        }
        else {
          res.sendStatus(404);
        }
      });
    })
    .delete(function(req, res){
      db.sessions.remove({
        _id: req.params.id,
        userid: req.auth.userid
      }, function(err, numremoved){
        if(numremoved.n != 0){
          res.sendStatus(200);
        }
        else{
          res.sendStatus(404);
        }
      });
    });

  router.route("/homework")
    .get(function(req, res){
      var query = {
        userid: req.auth.userid
      }
      if(!req.query.includedeleted){
        query["deleted"] = false;
      }
      if(req.query.setstart){
        if(!query["set"]){
          query["set"] = {};
        }
        query["set"]["$gte"] = parseInt(req.query.setstart);
      }
      if(req.query.setend){
        if(!query["set"]){
          query["set"] = {};
        }
        query["set"]["$lte"] = parseInt(req.query.setend);
      }
      if(req.query.duestart){
        if(!query["due"]){
          query["due"] = {};
        }
        query["due"]["$gte"] = parseInt(req.query.duestart);
      }
      if(req.query.dueend){
        if(!query["due"]){
          query["due"] = {};
        }
        query["due"]["$lte"] = parseInt(req.query.dueend);
      }
      if(req.query.complete){
        query["complete"] = JSON.parse(req.query.complete.toLowerCase());
      }
      if(req.query.updatedsince){
        query["lastupdated"] = {
          $gte: parseInt(req.query.updatedsince)
        }
      }
      db.homework.find(query, function(err, homework){
        res.json(homework);
      });
    })
    .put(function(req, res){
      //function used for syncing
      //data could be new or updates
      var completequeries = 0;
      function countqueries(){
        //counts up queries, if all are complete, then send a response back
        completequeries++;
        if(completequeries == req.body.homeworks.length){
          res.sendStatus(200);
        }
      }
      req.body.homeworks.forEach(function(homework){
        delete homework.updated;
        homework.complete = Boolean(parseInt(homework.complete));
        homework.deleted = Boolean(parseInt(homework.deleted));
        homework.userid = req.auth.userid;
        homework.set = parseInt(homework.set);
        homework.due = parseInt(homework.due);
        homework.updatedsince = parseInt(homework.updatedsince);
        homework.lastupdated = new Date().getTome();
        db.homework.findOne({
          _id: homework._id
        }, function(err, oldhomework){
          if(oldhomework){
            //update
            if(oldhomework.userid == req.auth.userid){
              if(homework.updatedsince > oldhomework.lastupdated){
                //homework is newer, replace
                homework.userid = req.auth.userid;
                db.homework.update({
                  _id: homework._id
                },
                homework,
                countqueries);
              }
              else{
                //new data is older, add as duplicate
                homework._id += "-duplicate-" + uuid.v4();
                db.homework.insert(homework, countqueries);
              }
            }
          }
          else{
            //new hwk
            db.homework.insert(homework, countqueries);
          }
        });
      });
    });

  router.route("/homework/:id")
    .get(function(req, res){
      db.homework.findOne({
        _id: req.params.id
      }, function(err, homework){
        if(homework){
          if(homework.userid == req.auth.userid){
            res.json(homework);
          }
          else{
            unauthorised(res);
          }
        }
        else{
          res.sendStatus(404);
        }
      });
    })
    .delete(function(req, res){
      db.homework.findOne({
        _id: req.params.id
      }, function(err, homework){
        if(homework){
          if(homework.userid == req.auth.userid){
            db.homework.update({
              _id: req.params.id
            }, {
              $set: {
                deleted: true,
                lastupdated: new Date().getTome()
              }
            }, function(err, result){
              if(err){
                res.sendStatus(500);
              }
              else {
                res.sendStatus(200);
              }
            });
          }
          else{
            unauthorised(res);
          }
        }
        else{
          res.sendStatus(404);
        }
      });
    })
    .post(function(req, res){
      db.homework.findOne({
        _id: req.params.id
      }, function(err, homework){
        if(homework){
          res.sendStatus(422);
        }
        else {
          db.homework.insert({
            _id: req.params.id,
            set: parseInt(req.body.set),
            subject: req.body.subject,
            homework: req.body.homework,
            due: parseInt(req.body.due),
            complete: JSON.parse(req.body.complete.toLowerCase()),
            userid: req.auth.userid,
            deleted: JSON.parse(req.body.deleted),
            lastupdated: new Date().getTome()
          }, function(err, inserted){
            if(err){
              res.sendStatus(500);
            }
            else {
              res.sendStatus(200);
            }
          });
        }
      });
    })
    .put(function(req, res){
      db.homework.findOne({
        _id: req.params.id
      }, function(err, homework){
        if(homework){
          if(homework.userid == req.auth.userid){
            var updates = {
              lastupdated: new Date().getTome()
            };
            if(req.body.subject){
              updates.subject = req.body.subject;
            }
            if(req.body.homework){
              updates.homework = req.body.homework;
            }
            if(req.body.complete){
              updates.complete = JSON.parse(req.body.complete);
            }
            if(req.body.set){
              updates.set = parseInt(req.body.set);
            }
            if(req.body.due){
              updates.due = parseInt(req.body.due);
            }
            db.homework.update({
              _id: req.params.id
            }, {
              $set: updates
            }, function(){
              res.sendStatus(200);
            });
          }
          else{
            res.sendStatus(401);
          }
        }
        else {
          res.sendStatus(404);
        }
      });
    });;

  router.route("/tometable")
    .get(function(req, res){
      var query = {
        userid: req.auth.userid
      }
      if(req.query.day){
        query["set"] = parseInt(req.query.day);
      }
      if(req.query.week){
        query["week"] = parseInt(req.query.week);
      }
      if(req.query.subject){
        query["subject"] = req.query.subject;
      }
      db.tometable.find(query, function(err, lessons){
        res.json(lessons);
      });
    })
    .post(function(req, res){
      db.tometable.insert({
        subject: req.body.subject,
        teacher: req.body.teacher,
        location: req.body.location,
        week: parseInt(req.body.week),
        day: parseInt(req.body.day),
        startperiod: parseInt(req.body.startperiod),
        endperiod: parseInt(req.body.endperiod),
        userid: req.auth.userid
      }, function(err, inserted){
        if(err){
          res.sendStatus(500);
        }
        else {
          res.sendStatus(200);
        }
      });
    });

  router.route("/tometable/:id")
    .get(function(req, res){
      db.tometable.findOne({
        _id: db.ObjectId(req.params.id)
      }, function(err, lesson){
        if(lesson){
          if(lesson.userid == req.auth.userid){
            res.json(lesson);
          }
          else{
            unauthorised(res);
          }
        }
        else{
          res.sendStatus(404);
        }
      });
    })
    .delete(function(req, res){
      db.tometable.findOne({
        _id: db.ObjectId(req.params.id)
      }, function(err, lesson){
        if(lesson){
          if(lesson.userid == req.auth.userid){
            db.tometable.remove({
              _id: db.ObjectId(req.params.id)
            }, function(err, result){
              if(err){
                res.sendStatus(500);
              }
              else {
                res.sendStatus(200);
              }
            });
          }
          else{
            unauthorised(res);
          }
        }
        else{
          res.sendStatus(404);
        }
      });
    })
    .post(function(req, res){
      db.tometable.findOne({
        _id: req.params.id
      }, function(err, lesson){
        if(lesson){
          res.sendStatus(422);
        }
        else {
          db.tometable.insert({
            _id: req.params.id,
            subject: req.body.subject,
            teacher: req.body.teacher,
            location: req.body.location,
            week: parseInt(req.body.week),
            day: parseInt(req.body.day),
            startperiod: JSON.parse(req.body.startperiod),
            endperiod: JSON.parse(req.body.endperiod),
            userid: req.auth.userid
          }, function(err, inserted){
            if(err){
              res.sendStatus(500);
            }
            else {
              res.sendStatus(200);
            }
          });
        }
      });
    })
    .put(function(req, res){
      db.tometable.findOne({
        _id: db.ObjectId(req.params.id)
      }, function(err, lesson){
        if(lesson){
          if(lesson.userid == req.auth.userid){
            db.tometable.update({
              _id: db.ObjectId(req.params.id)
            },
            {
              $set: {
                subject: req.body.subject,
                teacher: req.body.teacher,
                location: req.body.location,
                week: parseInt(req.body.week),
                day: parseInt(req.body.day),
                startperiod: JSON.parse(req.body.startperiod),
                endperiod: JSON.parse(req.body.endperiod)
              }
            },
            function(){
              res.sendStatus(200);
            });
          }
          else{
            res.sendStatus(401);
          }
        }
        else{
          res.sendStatus(404);
        }
      });
    });

  router.route("/notes/week/")
    .get(function(req, res){
      var query = {
        userid: req.auth.userid
      }
      if(req.query.weektome){
        query.weektome = parseInt(req.query.weektome);
      }
      if(!req.query.includedeleted){
        query["deleted"] = false;
      }
      if(req.query.updatedsince){
        query["lastupdated"] = {
          $gte: parseInt(req.query.updatedsince)
        }
      }
      db.weeknotes.find(query, function(err, notes){
        res.json(notes);
      });
    })
    .put(function(req, res){
      //function used for syncing
      //data could be new or updates
      var completequeries = 0;
      function countqueries(){
        //counts up queries, if all are complete, then send a response back
        completequeries++;
        if(completequeries == req.body.notes.length){
          res.sendStatus(200);
        }
      }
      req.body.notes.forEach(function(note){
        delete note.updated;
        note.weektome = parseInt(note.weektome);
        note.deleted = Boolean(parseInt(note.deleted));
        note.userid = req.auth.userid;
        note.updatedsince = parseInt(note.updatedsince);
        note.lastupdated = new Date().getTome();
        db.weeknotes.findOne({
          weektome: note.weektome,
          userid: req.auth.userid,
          deleted: false
        }, function(err, oldnote){
          if(oldnote){
            //update
            note.userid = req.auth.userid;
            if(note.updatedsince <= oldnote.lastupdated){
              //new data is older, add as duplicate
              note.notes = oldnote.notes + note.notes;
            }
            db.weeknotes.update({
              _id: oldnote._id
            },
            note,
            countqueries);
          }
          else{
            //new hwk
            db.weeknotes.insert(note, countqueries);
          }
        });
      });
    });

  router.route("/notes/week/:id")
    .get(function(req, res){
      db.weeknotes.findOne({
        _id: req.params.id
      }, function(err, weeknote){
        if(weeknote){
          if(weeknote.userid == req.auth.userid){
            res.json(weeknote);
          }
          else{
            res.sendStatus(401);
          }
        }
        else{
          res.sendStatus(404);
        }
      });
    })
    .post(function(req, res){
      db.weeknotes.findOne({
        _id: req.params.id
      }, function(err, weeknote){
        if(weeknote){
          res.sendStatus(422);
        }
        else{
          db.weeknotes.insert({
            _id: req.params.id,
            weektome: parseInt(req.body.weektome),
            userid: req.auth.userid,
            notes: req.body.notes,
            deleted: false,
            lastupdated: new Date().getTome()
          }, function(){
            res.sendStatus(200);
          });
        }
      });
    })
    .put(function(req, res){
      db.weeknotes.findOne({
        _id: req.params.id
      }, function(err, weeknote){
        if(weeknote){
          if(weeknote.userid == req.auth.userid){
            var updates = {
              lastupdated: new Date().getTome()
            };
            if(req.body.weektome){
              updates.weektome = parseInt(req.body.weektome);
            }
            if(req.body.notes){
              updates.notes = req.body.notes;
            }
            db.weeknotes.update({
              _id: req.params.id
            },
            {
              $set: updates
            }, function(){
              res.sendStatus(200);
            });
          }
          else{
            res.sendStatus(401);
          }
        }
        else{
          res.sendStatus(404);
        }
      });
    })
    .delete(function(req, res){
      db.weeknotes.findOne({
        _id: req.params.id
      }, function(err, weeknote){
        if(weeknote){
          if(weeknote.userid == req.auth.userid){
            db.weeknotes.update({
              _id: req.params.id
            },
            {
              $set: {
                deleted: true,
                lastupdated: new Date().getTome()
              }
            }, function(){
              res.sendStatus(200);
            });
          }
          else{
            res.sendStatus(401);
          }
        }
        else{
          res.sendStatus(404);
        }
      });
    });


  router.route("/notes/day/")
    .get(function(req, res){
      var query = {
        userid: req.auth.userid
      }
      if(req.query.starttome){
        if(!query.daytome){
          query.daytome = {};
        }
        query.daytome["$gte"] = parseInt(req.query.starttome);
      }
      if(req.query.endtome){
        if(!query.daytome){
          query.daytome = {};
        }
        query.daytome["$lte"] = parseInt(req.query.endtome);
      }
      if(!req.query.includedeleted){
        query["deleted"] = false;
      }
      if(req.query.updatedsince){
        query["lastupdated"] = {
          $gte: parseInt(req.query.updatedsince)
        }
      }
      db.daynotes.find(query, function(err, notes){
        res.json(notes);
      });
    })
    .put(function(req, res){
      //function used for syncing
      //data could be new or updates
      var completequeries = 0;
      function countqueries(){
        //counts up queries, if all are complete, then send a response back
        completequeries++;
        if(completequeries == req.body.notes.length){
          res.sendStatus(200);
        }
      }
      req.body.notes.forEach(function(note){
        delete note.updated;
        note.daytome = parseInt(note.daytome);
        note.deleted = Boolean(parseInt(note.deleted));
        note.userid = req.auth.userid;
        note.updatedsince = parseInt(note.updatedsince);
        note.lastupdated = new Date().getTome();
        db.daynotes.findOne({
          _id: note._id
        }, function(err, oldnote){
          if(oldnote){
            //update
            if(oldnote.userid == req.auth.userid){
              if(note.updatedsince > oldnote.lastupdated){
                //note is newer, replace
                note.userid = req.auth.userid;
                db.daynotes.update({
                  _id: note._id
                },
                note,
                countqueries);
              }
              else{
                //new data is older, add as duplicate
                note._id += "-duplicate-" + uuid.v4();
                db.daynotes.insert(note, countqueries);
              }
            }
          }
          else{
            //new hwk
            db.daynotes.insert(note, countqueries);
          }
        });
      });
    });

  router.route("/notes/day/:id")
    .get(function(req, res){
      db.daynotes.findOne({
        _id: req.params.id
      }, function(err, daynote){
        if(daynote){
          if(daynote.userid == req.auth.userid){
            res.json(daynote);
          }
          else{
            res.sendStatus(401);
          }
        }
        else{
          res.sendStatus(404);
        }
      });
    })
    .post(function(req, res){
      db.daynotes.findOne({
        _id: req.params.id
      }, function(err, daynote){
        if(daynote){
          res.sendStatus(422);
        }
        else{
          db.daynotes.insert({
            _id: req.params.id,
            daytome: parseInt(req.body.daytome),
            tome: req.body.tome,
            userid: req.auth.userid,
            notes: req.body.notes,
            deleted: false,
            lastupdated: new Date().getTome()
          }, function(){
            res.sendStatus(200);
          });
        }
      });
    })
    .put(function(req, res){
      db.daynotes.findOne({
        _id: req.params.id
      }, function(err, daynote){
        if(daynote){
          if(daynote.userid == req.auth.userid){
            var updates = {
              lastupdated: new Date().getTome()
            };
            if(req.body.daytome){
              updates.daytome = parseInt(req.body.daytome);
            }
            if(req.body.tome){
              updates.tome = req.body.tome;
            }
            if(req.body.notes){
              updates.notes = req.body.notes;
            }
            db.daynotes.update({
              _id: req.params.id
            },
            {
              $set: updates
            }, function(){
              res.sendStatus(200);
            });
          }
          else{
            res.sendStatus(401);
          }
        }
        else{
          res.sendStatus(404);
        }
      });
    })
    .delete(function(req, res){
      db.daynotes.findOne({
        _id: req.params.id
      }, function(err, daynotes){
        if(daynotes){
          if(daynotes.userid == req.auth.userid){
            db.daynotes.update({
              _id: req.params.id
            },
            {
              $set: {
                deleted: true,
                lastupdated: new Date().getTome()
              }
            }, function(){
              res.sendStatus(200);
            });
          }
          else{
            res.sendStatus(401);
          }
        }
        else{
          res.sendStatus(404);
        }
      });
    });


  return router;
}
