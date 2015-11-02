$("#modal-editweeknote").on("show", function(){
  var id = $("#modal-editweeknote").data("id");
  dbdata.notes.week.findbyid(id, function(note){
    $("#modal-editweeknote").html(
      templates.main.modals.editweeknote.main({
        note: note
      })
    );
    editors["editweeknote"] = new Quill("#modal-editweeknote .notes .editor", {
      modules: {
        "toolbar": {
          container: "#modal-editweeknote .notes .toolbar"
        }
      },
      theme: "snow"
    });
    $("#modal-editweeknote").off("shown.bs.modal");
    $("#modal-editweeknote").on("shown.bs.modal", function(){
      editors["editweeknote"].focus();
    });
    $("#modal-editweeknote form").off("submit");
    $("#modal-editweeknote form").submit(function(e){
      e.preventDefault();
      dbdata.notes.week.update({
        id: $("#modal-editweeknote form input[name='id']").val(),
        notes: editors.editweeknote.getHTML()
      }, function(){
        weekreload();
        $("#modal-editweeknote").modal("hide");
      });
    });
    $("#modal-editweeknote form input[name='delete']").off("click");
    $("#modal-editweeknote form input[name='delete']").click(function(){
      dbdata.notes.week.delete($("#modal-editweeknote form input[name='id']").val(), function(){
        weekreload();
        $("#modal-editweeknote").modal("hide");
      });
    });
    $("#modal-editweeknote").modal("show");
  });
});
