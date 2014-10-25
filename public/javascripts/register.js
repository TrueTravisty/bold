$(function() {

  $("#registerform").submit(function(event) {
    event.preventDefault();
    var user = $("#username").val();
    var passwd = $("#password").val();
    var repeat = $("#repeat").val();
    var error = false;

    if (passwd.length < 8) {
      $("#pwerror").html("* Password must have 8 characters or more")
      error = true;
    } else {
      $("#pwerror").html("");
    }

    if (passwd !== repeat) {
      $("#reperror").html("* Please make sure the passwords are equal");
      error = true;
    } else {
      $("#reperror").html("");
    }

    if (!user) {
      error = true;
      $("#usererror").html("* Please enter a username");
    } else {
      $("#usererror").html("");
    }

    if (!error) {
      $.post('/register',
      {
        username: user,
        password: passwd
      }, function(data) {
        if (data === "OK") {
          window.location.assign("/login");
        } else {
          $("#usererror").html("Registration failed. Try a different username.");
        }
     });
    }

    return false;
  });
});
