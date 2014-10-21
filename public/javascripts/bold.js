$(document).ready(function() {
  $("#contractvalue_input").focus(function() {
       $(this).select();
  });
});

$(document).ready(function() {
  $("#messagebox .error").each(function() {
    $.growl.error({message: $(this).text(), static: true});
  });
  $("#messagebox .warning").each(function() {
    $.growl.warning({message: $(this).text(), duration: 10000});
  });
  $("#messagebox .info").each(function() {
    $.growl.notice({message: $(this).text(), duration: 5000});
  });

});
