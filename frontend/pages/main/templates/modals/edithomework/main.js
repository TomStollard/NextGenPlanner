$("#modal-edithomework").on("show", function(){
  dbdata.homework.getbyid($("#modal-edithomework").data("id"), function(homework){
    $("#modal-edithomework").html(
      templates.main.modals.edithomework.main({
        homework: homework
      })
    );

    editors["edithomework"] = new Quill("#modal-edithomework .homeworkcontent .editor", {
      modules: {
        "toolbar": {
          container: "#modal-edithomework .homeworkcontent .toolbar"
        }
      },
      theme: "snow"
    });

    $("#modal-edithomework input[name='setpicker']").pickadate();
    $("#modal-edithomework input[name='duepicker']").pickadate();

    $("#modal-edithomework input[name='delete']").off("click")
    .click(function(){
      bootbox.confirm("Are you sure you want to delete this?", function(result){
        if(result){
          dbdata.homework.delete($("#modal-edithomework input[name='id']").val(), function(){
            $.when($("#mainpage-panels .panel").fadeOut()).then(function(){
              loadmainpage(function(){
                $("#mainpage-panels .panel").fadeIn();
              })
            });
            $("#modal-edithomework").modal("hide");
          });
        }
      });
    });

    $("#modal-edithomework form").off("submit")
    .submit(function(e){
      e.preventDefault();
      var id = $("#modal-edithomework input[name='id']").val();
      async.parallel([
        function(callback){
          $.when($("#mainpage-panels .panel").fadeOut()).then(callback);
        },
        function(callback){
          dbdata.homework.update(id, {
            set: moment(new Date($("#modal-edithomework input[name='setpicker']").val())).add(12, "hours").valueOf(),
            due: moment(new Date($("#modal-edithomework input[name='duepicker']").val())).add(12, "hours").valueOf(),
            subject: $("#modal-edithomework input[name='subject']").val(),
            homework: editors.edithomework.getHTML()
          }, function(){
            $("#modal-edithomework").modal("hide");
            callback();
          });
        }
      ], function(){
        offline.sync.withui();
        loadmainpage(function(){
          $("#mainpage-panels .panel").fadeIn();
        })
      });
    });

    $("#modal-edithomework").modal("show");
  });
});
