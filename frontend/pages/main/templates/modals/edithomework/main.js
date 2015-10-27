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

    $("#modal-edithomework form").off("submit")
    .submit(function(e){
      e.preventDefault();
      
    });

    $("#modal-edithomework").modal("show");
  });
});
