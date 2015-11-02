$("#modal-addweeknote").on("show", function(){
  var weektome = parseInt($("#modal-addweeknote").data("weektome"));
  $("#modal-addweeknote").html(
    templates.main.modals.addweeknote.main({
      weektome: weektome
    })
  );
  editors["addweeknote"] = new Quill("#modal-addweeknote .notes .editor", {
    modules: {
      "toolbar": {
        container: "#modal-addweeknote .notes .toolbar"
      }
    },
    theme: "snow"
  });
  $("#modal-addweeknote").off("shown.bs.modal");
  $("#modal-addweeknote").on("shown.bs.modal", function(){
    editors["addweeknote"].focus();
  });
  $("#modal-addweeknote form").off("submit");
  $("#modal-addweeknote form").submit(function(e){
    e.preventDefault();
    dbdata.notes.week.insert({
      id: generateitemid(),
      weektome: parseInt($("#modal-addweeknote form input[name='weektome']").val()),
      deleted: false,
      notes: editors.addweeknote.getHTML()
    }, function(){
      weekreload();
      $("#modal-addweeknote").modal("hide");
    });
  });
  $("#modal-addweeknote").modal("show");
});
