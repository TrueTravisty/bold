$(function() {
  $("#settingsform input").blur(function() {
    var name = this.name;
    var value = this.value;
    $.post('/admin/settings/' + name,
      {
        value: this.value
      }, function(data) {
        if (data != "Unchanged") {
          var dname = "#" + name + "_result";
          if (data == "OK")
            $.growl.notice({message: 'Setting ' + name + ' successfully set to ' + value + '.', duration: 5000})
          else
            $.growl.warning({message: 'Could not set ' + name + '.', duration: 5000})
        }
     });
  });

});
