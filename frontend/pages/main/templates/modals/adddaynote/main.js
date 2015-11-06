$("#modal-adddaynote").on("show", function(){
  var daytome = parseInt($("#modal-adddaynote").data("daytome"));
  $("#modal-adddaynote").html(
    templates.main.modals.adddaynote.main({
      daytome: daytome
    })
  );
  editors["adddaynote"] = new Quill("#modal-adddaynote .notes .editor", {
    modules: {
      "toolbar": {
        container: "#modal-adddaynote .notes .toolbar"
      }
    },
    theme: "snow"
  });
  $("#modal-adddaynote").off("shown.bs.modal");
  $("#modal-adddaynote").on("shown.bs.modal", function(){
    editors["adddaynote"].focus();
  });
  $("#modal-adddaynote form").off("submit");
  $("#modal-adddaynote form").submit(function(e){
    e.preventDefault();
    dbdata.notes.day.insert({
      id: generateitemid(),
      daytome: parseInt($("#modal-adddaynote form input[name='daytome']").val()),
      deleted: false,
      notes: editors.adddaynote.getHTML(),
      tome: $("#modal-adddaynote form input[name='tome']").val()
    }, function(){
      weekreload();
      $("#mainpage-panel-dayview").slideUp(function(){
        loaddaydetails(function(){
          updatedaynotebindings();
          updatehomeworkbindings();
          $("#mainpage-panel-dayview").slideDown();
        });
      });
      $("#modal-adddaynote").modal("hide");
    });
  });
  $("#modal-adddaynote").modal("show");
});
