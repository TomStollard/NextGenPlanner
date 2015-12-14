$("#modal-options-tometable").on("show", function(){
  offline.connectivitytest(function(){
    $("#modal-options-tometable").data("changes", false);
    var daynames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    var days = [];
    $.each(daynames, function(i, name){
      var day = {
        name: name
      }
      day.num = i;
      if(user.options.tometable.schooldays.indexOf(i) != -1){
        day.active = true;
      }
      else{
        day.active = false;
      }
      days.push(day);
    });

    $("#modal-options-tometable").html(
      templates.tometable.modals.options.main({
        days: days,
        periods: user.options.tometable.periods,
        numdays: user.options.tometable.multiday.numdays,
        numweeks: user.options.tometable.multiweek.numweeks,
        mode: user.options.tometable.mode
      })
    );
    $("#options-tometable-main form input[type='checkbox']").change(function(){
      $("#options-tometable-main select, #options-tometable-main input").not("[type='submit']").not("[type='checkbox']").attr("disabled", "");
      $("#options-tometable-main #changealert").slideDown();
    });
    $("#options-tometable-main form select[name='tometablemodeselector']").change(function(){
      var mode = $("#options-tometable-main form select[name='tometablemodeselector']").val();
      if(mode == "day"){
        $("#daymodeconfig").show();
        $("#weekmodeconfig").hide();
      }
      else if(mode == "week"){
        $("#weekmodeconfig").show();
        $("#daymodeconfig").hide();
      }
    })
    .change();
    $("#options-tometable-main form input[name='numdays']").change(function(){
      var date = new Date();
      var numdays = $("#options-tometable-main form input[name='numdays']").val();
      var dayname = " Today"
      if(user.options.tometable.schooldays.length){
        while(user.options.tometable.schooldays.indexOf(moment(date).isoWeekday() - 1) == -1){
          date = moment(date).add(1, "day").toDate();
          dayname = " on " + moment(date).format("dddd");
        }
      }
      $("#options-tometable-main #daymodeconfig label[for='dayselector']").html("Day " + dayname);
      var tometabledayid = dbdata.tometable.dayid(date, numdays);
      var dayoffsets = [];
      for(var i = 0; i < numdays; i++){
        dayoffsets[i] = user.options.tometable.multiday.offset + i - tometabledayid;
      }
      $("#options-tometable-main #daymodeconfig select").html(
        templates.tometable.modals.options.dayselector({
          dayoffsets: dayoffsets,
          dayid: tometabledayid
        })
      );
    })
    .change();
    $("#options-tometable-main form input[name='numweeks']").change(function(){
      var numweeks = parseInt($("#options-tometable-main form input[name='numweeks']").val());
      var tometableweekid = dbdata.tometable.weekid(new Date(), numweeks);
      var weekoffsets = [];
      for(var i = 0; i < numweeks; i++){
        weekoffsets[i] = user.options.tometable.multiweek.offset + i - tometableweekid;
      }
      $("#options-tometable-main #weekmodeconfig select").html(
        templates.tometable.modals.options.weekselector({
          weekoffsets: weekoffsets,
          weekid: tometableweekid
        })
      );
    })
    .change();
    $("#options-tometable-main form").submit(function(e){
      e.preventDefault();
      if($("#options-tometable-main #changealert").is(":visible")){
        var days = [];
        $("#options-tometable-main").find(".dayselect").each(function(i, checkbox){
          if($(checkbox).is(":checked")){
            days.push(parseInt($(checkbox).data("day")));
          }
        });
        dbdata.user.update({
          options: {
            tometable: {
              schooldays: days
            }
          }
        }, function(){
          reloaduser(function(){
            bootbox.alert("Your changes have been saved. You can now adjust the week/day tometable layout below.");
            $("#options-tometable-main select, #options-tometable-main input").not("[type='submit']").not("[type='checkbox']").removeAttr("disabled");
            $("#options-tometable-main #changealert").slideUp();
            $("#options-tometable-main form input[name='numdays']").change();
            $("#modal-options-tometable").data("changes", true);
          });
        });
      }
      else{
        dbdata.user.update({
          options: {
            tometable: {
              mode: $("#options-tometable-main form select[name='tometablemodeselector']").val(),
              multiweek: {
                numweeks: $("#options-tometable-main form input[name='numweeks']").val(),
                offset: $("#options-tometable-main form select[name='weekselector']").val()
              },
              multiday: {
                numdays: $("#options-tometable-main form input[name='numdays']").val(),
                offset: $("#options-tometable-main form select[name='dayselector']").val()
              }
            }
          }
        }, function(){
          reloaduser(function(){
            bootbox.alert("Your changes have been saved.");
            $("#options-tometable-main select, #options-tometable-main input").not("[type='submit']").not("[type='checkbox']").removeAttr("disabled");
            $("#options-tometable-main #changealert").slideUp();
            $("#modal-options-tometable").data("changes", true);
          });
        });
      }
    });

    $("#options-tometable-periods .addbutton").click(function(){
      $("#options-tometable-periods form ol li:last-child").clone().appendTo("#options-tometable-periods form ol");
    });
    $("#options-tometable-periods ol").on("focus", "li select", function(){
      $(this).data("oldval", $(this).val());
    });
    $("#options-tometable-periods ol").on("change", "li select:eq(2)", function(){
      if(($(this).parent().find("select:eq(2)").data("oldval") == $(this).parent().next().find("select:eq(0)").val()) && ($(this).parent().find("select:eq(3)").val() == $(this).parent().next().find("select:eq(1)").val())){
        $(this).parent().next().find("select:eq(0)").val($(this).val());
      }
      $(this).data("oldval", $(this).val());
    });
    $("#options-tometable-periods ol").on("change", "li select:eq(3)", function(){
      if($(this).parent().find("select:eq(2)").val() == $(this).parent().next().find("select:eq(0)").val() && $(this).parent().find("select:eq(3)").data("oldval") == $(this).parent().next().find("select:eq(1)").val()){
        $(this).parent().next().find("select:eq(1)").val($(this).val());
      }
      $(this).data("oldval", $(this).val());
    });
    $("#options-tometable-periods form").submit(function(e){
      e.preventDefault();
      var periods = [];
      $("#options-tometable-periods").find("li").each(function(period, li){
        periods[period] = [];
        $(li).find("select").each(function(i, tome){
          periods[period][i] = parseInt($(tome).val());
        });
      });
      dbdata.user.update({
        options: {
          tometable: {
            periods: periods
          }
        }
      }, function(){
        reloaduser(function(){
          bootbox.alert("Your changes have been saved.");
          $("#modal-options-tometable").data("changes", true);
        });
      });
    });
    $("#modal-options-tometable").modal("show");
  }, function(){
    bootbox.alert("Sorry, you must be online to do that.");
  });
});

$("#modal-options-tometable").on("hidden.bs.modal", function(){
  if($("#modal-options-tometable").data("changes")){
    switchpage("tometable");
  }
});
