$(function() {
  loadApis();

  $('.deleteApi').click(deleteApiCall);

  $('#addApi').submit(function(event) {
    event.preventDefault();
    $('#addStatus').html('<img src="/images/icons/wait.GIF"/>')
    var key = $("#apiKey").val();
    var ver = $('#apiVerification').val();
    $.post('/api/validate',
      {
        apiKey: key,
        apiVerification: ver
      }, function(data) {
        if (data == "OK") {
          $('#addStatus').html('<img src="/images/icons/ok.png"/>')
          $.post('/api',
          {
            apiKey: key,
            apiVerification: ver
          }, function(result) {
            if (result == 'OK') {
              $("#apiKey").val('');
              $('#apiVerification').val('');
              loadApis();
              $.growl.notice({message:"Added new API"});
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
  $.get('/api', function(data) {
    $('#api-list').html(data);
    $('.deleteApi').click(deleteApiCall);

  })
}

function deleteApiCall() {
  $("body").css("cursor", "progress");
  $.ajax({
    url: '/api/delete/' + $(this).attr('value'),
    type: 'DELETE',
    success: function(result) {
        loadApis();
        $.growl.notice({message:"Removed API"});
        $("body").css("cursor", "default");
    },
    error: function(result, string) {
      $.growl.warning({message:"Could not remove API"});
      $("body").css("cursor", "default");
    }
  });
}
