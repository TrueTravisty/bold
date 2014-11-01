$(function() {

  $('.togglerole').click(function() {
    var user = $(this).attr('data-user');
    var role = $(this).attr('data-role');
    var button = $(this);

    $.post('/admin/togglerole',
    {
      user: user,
      role: role
    }, function(data) {
      button.attr('value', data);
      button.text(data);
   }).fail(function() {
     alert("Could not toggle");
   });
  });
})
