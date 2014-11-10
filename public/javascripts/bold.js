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

  $.get('/redditnews', function(data) {
    kills = JSON.parse(data);
    $('#latestreddit').html(data);
  });
});

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
