$("#modal-editdaynote").on("show", function(){
  var id = $("#modal-editdaynote").data("id");
  dbdata.notes.day.findbyid(id, function(note){
    $("#modal-editdaynote").html(
      templates.main.modals.editdaynote.main({
        note: note
      })
    );
    editors["editdaynote"] = new Quill("#modal-editdaynote .notes .editor", {
      modules: {
        "toolbar": {
          container: "#modal-editdaynote .notes .toolbar"
        }
      },
      theme: "snow"
    });
    $("#modal-editdaynote form input[name='day']").pickadate();
    $("#modal-editdaynote").off("shown.bs.modal");
    $("#modal-editdaynote").on("shown.bs.modal", function(){
      editors["editdaynote"].focus();
    });
    $("#modal-editdaynote form").off("submit");
    $("#modal-editdaynote form").submit(function(e){
      e.preventDefault();
      dbdata.notes.day.update({
        id: $("#modal-editdaynote form input[name='id']").val(),
        notes: editors.editdaynote.getHTML(),
        daytome: new Date($("#modal-editdaynote form input[name='day']").val()).getTome(),
        tome: $("#modal-editdaynote form input[name='tome']").val()
      }, function(){
        weekreload();
        offline.sync.withui();
        $("#mainpage-panel-dayview").slideUp(function(){
          loaddaydetails(function(){
            updatedaynotebindings();
            updatehomeworkbindings();
            $("#mainpage-panel-dayview").slideDown();
          });
        });
        $("#modal-editdaynote").modal("hide");
      });
    });
    $("#modal-editdaynote form input[name='delete']").off("click");
    $("#modal-editdaynote form input[name='delete']").click(function(){
      dbdata.notes.day.delete($("#modal-editdaynote form input[name='id']").val(), function(){
        weekreload();
        offline.sync.withui();
        $("#mainpage-panel-dayview").slideUp(function(){
          loaddaydetails(function(){
            updatedaynotebindings();
            updatehomeworkbindings();
            $("#mainpage-panel-dayview").slideDown();
          });
        });
        $("#modal-editdaynote").modal("hide");
      });
    });
    $("#modal-editdaynote").modal("show");
  });
});
