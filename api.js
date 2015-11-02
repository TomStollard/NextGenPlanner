module.exports = function(db){
  var express = require("express");
  var router = express.Router();
  var basicAuth = require("basic-auth");


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
          console.log(err);
        }
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
      db.homework.find(query, function(err, homework){
        res.json(homework);
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
                deleted: true
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
            deleted: JSON.parse(req.body.deleted)
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
      db.weeknotes.find(query, function(err, notes){
        res.json(notes);
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
            deleted: false
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
            var updates = {};
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
                deleted: true
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
