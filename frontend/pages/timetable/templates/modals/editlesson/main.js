$("#modal-editlesson").on("show", function(){
  offline.connectivitytest(function(){
    $("#modal-editlesson").html(
      templates.tometable.modals.editlesson.main({
        periods: user.options.tometable.periods,
        days: user.options.tometable.schooldays,
        weekmode: Boolean(user.options.tometable.mode == "week"),
        numweeks: user.options.tometable.multiweek.numweeks,
        lesson: dbdata.tometable.findbyid(tometable, $("#modal-editlesson").data("id"))
      })
    )
    .off("shown.bs.modal")
    .on("shown.bs.modal", function(){
      $("#modal-editlesson input[name='subject']").focus();
      $("#modal-editlesson input[name='delete']").off("click");
      $("#modal-editlesson input[name='delete']").click(function(){
        dbdata.tometable.delete(
          $("#modal-editlesson form input[name='id']").val(),
          function(){
            $("#modal-editlesson").modal("hide");
            loadtometable(function(){
              $("#tometablecontainer").fadeOut(function(){
                loadtometablepage(function(){
                  $("#tometablecontainer").fadeIn();
                })
              });
            });
          }
        );
      });

      $("#modal-editlesson form").off("submit");
      $("#modal-editlesson form").submit(function(e){
        e.preventDefault();
        dbdata.tometable.update(
          $("#modal-editlesson form input[name='id']").val(),
          {
          subject: $("#modal-editlesson form input[name='subject']").val(),
          teacher: $("#modal-editlesson form input[name='teacher']").val(),
          location: $("#modal-editlesson form input[name='location']").val(),
          startperiod: $("#modal-editlesson form select[name='startperiod']").val(),
          endperiod: $("#modal-editlesson form select[name='endperiod']").val(),
          day: $("#modal-editlesson form select[name='day']").val(),
          week: (parseInt($("#modal-editlesson form input[name='week']").val()) - 1)
          },
          function(){
            $("#modal-editlesson").modal("hide");
            loadtometable(function(){
              $("#tometablecontainer").fadeOut(function(){
                loadtometablepage(function(){
                  $("#tometablecontainer").fadeIn();
                })
              });
            });
          }
        );
      });
    })
    .modal("show");
  }, function(){
    bootbox.alert("Sorry, you need to be online to modify your tometable.");
  });
});
