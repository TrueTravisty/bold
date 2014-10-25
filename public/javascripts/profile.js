$(function() {
  loadApis();

  $('.deleteApi').click(deleteApiCall);

  $('#addApi').submit(function(event) {
    event.preventDefault();
    $('#addStatus').html('<img src="/images/icons/wait.GIF"/>')
    var key = $("#apiKey").val();
    var ver = $('#apiVerification').val();
    $.post('/validateApi',
      {
        apiKey: key,
        apiVerification: ver
      }, function(data) {
        if (data == "OK") {
          $('#addStatus').html('<img src="/images/icons/ok.png"/>')
          $.post('/newapi',
          {
            apiKey: key,
            apiVerification: ver
          }, function(result) {
            if (result == 'OK') {
              $("#apiKey").val('');
              $('#apiVerification').val('');
              loadApis();
            }
          })
        }
     }
    ).error(function() {
      alert("Could not save API");
    });
    return false;
  });
});

function loadApis() {
  $.get('/apiList', function(data) {
    $('#api-list').html(data);
    $('.deleteApi').click(deleteApiCall);

  })
}

function deleteApiCall() {
  alert("Delete " + $(this).attr('value') + '!');
  $.ajax({
    url: '/deleteApi/' + $(this).attr('value'),
    type: 'DELETE',
    success: function(result) {
        loadApis();
        $.growl.notify("Removed API");
    },
    error: function(result, string) {
      $.growl.warning("Could not remove API");
    }
  });
}
