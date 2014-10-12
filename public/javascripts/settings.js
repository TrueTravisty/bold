$(function() {
  $("#settingsform input").blur(function() {
    var name = this.name;
    $.post('/admin/settings/' + name,
      {
        value: this.value
      }, function(data) {
        if (data != "Unchanged") {
          var dname = "#" + name + "_result";
          $(dname).html(data);
        }
     });
  });
  
});