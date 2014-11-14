$(function() {
  $("#contractvalue_input").focus(function() {
       $(this).select();
  });
});

$(function() {
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

$(function() {
  if ($('#latestkills').length > 0) {
    $.get('/corpkills/5', function(data) {

      $('#latestkills').html(data);
    });

    $.get('/corplosses/5', function(data) {
      $('#latestlosses').html(data);
    });

    $.get('/corplosses/top/14/5', function(data) {
      $('#toplosslist').html(data);
    });

    $.get('/corpkills/top/14/5', function(data) {
      $('#topkilllist').html(data);
    });
  }

  if ($('#latestreddit').length > 0) {
    $.get('/redditnews', function(data) {
      $('#latestreddit').html(data);
    });


    $.get('/bnireddit', function(data) {
      $('#latestredditbni').html(data);
    })
  }

  $('.dropdown > h3').click(function() {
    $('.droparrow', this).toggleClass('up');
    var parent = $(this).parent();
    $(".hidable", parent).slideToggle();
  });
});

$(function() {
  if ($('#mylosses').length > 0) {
    $.get('/charloss/5/1', function(data) {
      ammendKillmails(data).appendTo($('#mylosses'));
      $('.more').attr('data-page', 1);
    });
    $('.more').click(function() {
      var page = parseInt($(this).attr('data-page')) + 1;
      $.get('/charloss/5/' + page, function(data) {
        ammendKillmails(data).appendTo($('tbody', '#mylosses'));
        $('.more').attr('data-page', page);
      });
    })
  }
});

function ammendKillmails(data) {
  var d = $(data);
  var rows = d.find('tr.kill');
  if (rows.length == 0)
    rows = d.filter('tr.kill');
  rows.append($('<td><button class="SRP">Request SRP</button></td>'));
  var date = d.find('.dateline');
  date.attr('colspan', 6);
  var buttons = d.find('.SRP');
  buttons.click(srpRequest);
  return d;
}

function srpRequest() {
  var kill = $(this).parents('.kill').attr('data-id');
  $.get('/srprequested/' + kill, function(data) {
    var submitted = JSON.parse(data);
    if (submitted) {
      return $.growl.error({message: "SRP already requested for this kill!"});
    }
    $.growl.notice({message: "Requesting SRP for kill " + kill});
  })
}

function listKills(kills) {
  var result = $('<div class=killmails>');
  var nfOptions = new JsNumberFormatter.formatNumberOptions().specifyDecimalMask('00');
  for (var i = 0, l = kills.length; i<l; ++i) {
    var kill = $("<div>").addClass('kill');
    kill.append('<a class="zkblink" href="https://zkillboard.com/kill/' + kills[i].killID + '">zKillBoard</a>');
    var victim = $('<div class="victim"></div>');
    victim.append('<div class="character">'+kills[i].victim.characterName+'</div>');
    victim.append('<div class="ship">' + kills[i].victim.shipType + '</div>')
    kill.append(victim);
    if (kills[i].zkb) {
      var value = parseFloat(kills[i].zkb.totalValue);
      kill.append('<div class="value">'
                  + JsNumberFormatter.formatNumber(value, nfOptions, true)
                    + ' ISK </div>');
    }
    result.append(kill);

  }
  return result;
}
