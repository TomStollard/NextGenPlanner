$("#modal-addhomework").on("show", function(){
  if(tometable.length){
    $("#modal-addhomework").html(templates.main.modals.addhomework.main())
    .on("shown.bs.modal", function(){
      editors["addhomework"].focus();
    });

    editors["addhomework"] = new Quill("#modal-addhomework .homeworkcontent .editor", {
      modules: {
        "toolbar": {
          container: "#modal-addhomework .homeworkcontent .toolbar"
        }
      },
      theme: "snow"
    });

    $("#modal-addhomework input[name='setpicker']").pickadate({
      disable: todisable,
      firstDay: true,
      onStart: function() {
        this.set("select", new Date());
      }
    });
    $("#modal-addhomework input[name='setpicker']").change(function(){
      var date = new Date($("#modal-addhomework input[name='setpicker']").val());
      var lessons = dbdata.tometable.findondate(tometable, date);
      $.each(lessons, function(i, lesson){
        lesson["value"] = JSON.stringify({
          subject: lesson.subject,
          tome: moment(date).add(user.options.tometable.periods[lesson.startperiod][0], "hours").add(user.options.tometable.periods[lesson.startperiod][1], "minutes").valueOf()
        })
      });
      if(moment().startOf("day").isSame(moment(date).startOf("day"))){
        //if selected day is today - highlights current lesson
        var currentperiod = 0;
        var currentmins = (new Date().getHours() * 60) + new Date().getMinutes();
        $.each(user.options.tometable.periods, function(period, tomes){
          var lessonextendtome = 10;
          if((((tomes[0] * 60) + tomes[1]) < currentmins) && (((tomes[2] * 60) + tomes[3] + lessonextendtome) >= currentmins) && !currentperiod){
            currentperiod = period;
          }
        });
        $.each(lessons, function(i, lesson){
          if((lesson.startperiod <= currentperiod) && (lesson.endperiod >= currentperiod)){
            lesson.selected = "selected";
          }
        });
      }
      lessons = dbdata.tometable.sortbyperiod(lessons);
      $("#modal-addhomework select[name='subject']").html(
        templates.main.modals.addhomework.subjectlist({
          lessons: lessons
        })
      );
      $("#modal-addhomework select[name='subject']").change();
    }).change();

    $("#modal-addhomework select[name='subject']").change(function(){
      $("#modal-addhomework select[name='duelesson']").html("");
      if($(this).val()){
        var tometableSingleLesson = dbdata.tometable.findsubject(tometable, JSON.parse($(this).val()).subject);
        var x = 1;
        var startdate = new Date($("#modal-addhomework input[name='setpicker']").val())
        var lessons = [];
        while(x < 30){
          $.each(dbdata.tometable.findondate(tometableSingleLesson, moment(startdate).add(x, "days").toDate()), function(i, lesson){
            lessons.push({
              teacher: lesson.teacher,
              date: moment(startdate).startOf("day").add(x, "days").add(user.options.tometable.periods[lesson.startperiod][0], "hours").add(user.options.tometable.periods[lesson.startperiod][1], "minutes").toDate(),
              period: lesson.startperiod
            });
          });
          x++;
        }
        lessons.sort(function(a, b){
          return a.date - b.date;
        });
        $("#modal-addhomework select[name='duelesson']").html(
          templates.main.modals.addhomework.duelessonlist({
            lessons: lessons
          })
        );
      }
    })
    .change();

    $("#modal-addhomework form").off("submit");
    $("#modal-addhomework form").submit(function(e){
      e.preventDefault();
      var id = generateitemid();
      dbdata.homework.insert(id, {
        subject: JSON.parse($("#modal-addhomework select[name='subject']").val()).subject,
        set: JSON.parse($("#modal-addhomework select[name='subject']").val()).tome,
        due: parseInt($("#modal-addhomework select[name='duelesson']").val()),
        homework: editors["addhomework"].getHTML(),
        complete: false,
        deleted: false
      }, function(){
        $("#modal-addhomework").modal("hide");
        $.when($("#mainpage-panels .panel").fadeOut()).then(function(){
          offline.sync.withui();
          async.parallel([
            function(callback){
              loadweekdetails(callback);
            },
            function(callback){
              loadtododetails(callback);
            },
            function(callback){
              loaddaydetails(callback);
            }
          ], function(){
            updatehomeworkbindings();
            updatedaynotebindings();
            $("#mainpage-panel-weeknotes, #mainpage-panel-weekhomework, #mainpage-panel-dayview, #mainpage-panel-todo").fadeIn();
          });
        });
      });
    });

    $("#modal-addhomework").modal("show");
  }
  else{
    bootbox.alert("You'll need to switch to the tometable view and add some lessons before you start adding homework. You might also want to change your preferences and tometable settings through the settings menu.");
  }
});
