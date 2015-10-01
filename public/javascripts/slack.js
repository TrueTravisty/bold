$(function() {

  $("#slackform").submit(function(event) {
    event.preventDefault();
    var email = $("#email").val();
    $.post('/slack',
      {
        email: email
      }, function(data) {
        if (data == 'OK')
          $.growl.notice({message: "Slack invite sent to " + email + ". Check your email.", duration: 5000});
        else if (data == "invalid_email")
          $.growl.warning({message: "Invalid email address. Please provide a proper address.", duration: 5000});
        else if (data == "already_in_team")
          $.growl.notice({message: "There is already a user registered with that email.", duration: 5000});
        else if (data == "already_invited")
          $.growl.notice({message: "An invitation has already been sent to that email.", duration: 5000});
        else if (data == "ERROR")
          $.growl.warning({message: "Something went wrong when trying to add the user to slack. If this persist, email Yaldo Asanari or the corp CEO for a Slack invite.", duration: 5000});

     }
  ).error(function() {
   alert("Error");
  });
  return false;
  });
});

// OK
// already_in_team
// already_invited
// invalid_email
