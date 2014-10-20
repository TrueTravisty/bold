$(function() {

  $("#buybackcalculator").submit(function(event) {
    event.preventDefault();
    var result = $("#raw_textarea").val();
    $.post('/buyback',
      {
        raw_paste: result
      }, function(data) {
        $("#contractvalue_input").val(data);
        $(".contractvalue_section").slideDown();
        $('#contractvalue_input').focus();
     }
  ).error(function() {
   alert("Error");
  });
  return false;
  });
});
