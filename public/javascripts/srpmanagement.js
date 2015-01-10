$(function() {
  $.growl.notice({message: "Running SRP management script", duration: 5000});

  $("#insuranceValueForm input").blur(function() {
    var name = this.name;
    var value = this.value;
    $.growl.notice({message: "Insurance for ship '" + name + "' set to " + value, duration: 5000});
  });
})
