$(function() {
  $("#insuranceValueForm").submit(function(event) {
    event.preventDefault();
  });

  var insuranceValues = $('#insuranceValues');
  if (insuranceValues.length <= 0) return;

  $.getJSON('/admin/srp/insurance/all', function(data) {
    $.growl.notice({message: "Got data", duration: 5000});
    var table = $('<table id="insuranceTable"><thead><tr><th>Shipe</th><th>Image</th><th>Insurance</th><th>SRP Factor</th><th>Set by</th><th>Set at</th></tr></thead><tbody></tbody></table>');
    for (var i = 0, l = data.length; i<l; ++i) {
      var ship = data[i];
      var row = $('<tr></tr>');
      setCells(row);
      populateRow(row, ship);
      table.append(row);
    }
    insuranceValues.html(table);
  })
})


function setCells(row) {
  row.html('<td class="ship"></td><td class="image"></td><td class="insurance"></td><td class="srpFactor"></td><td class="setby"></td><td class="setat"></td>');
}

function populateRow(row, ship) {
  $('tr', row).data(ship.shipid);
  $('.ship', row).text(ship.shipname);
  $('.image', row).html('<img src="/images/Types/' + ship.shipid + '_64.png"></img>')
  var input = $('<input type="text"></input>');
  input.attr('name', ship.shipid);
  input.blur(blurInputField);
  if (ship.insurance) {
    input.attr('value', ship.insurance);
  }
  $('.insurance', row).html(input);

  var factor = $('<input name="srpfactor" type="text"></input>');
  factor.attr('name', ship.shipid);
  factor.blur(blurInputField);
  var factorValue = ship.srpFactor ? ship.srpFactor : 0.9;
  factor.attr('value', factorValue);
  row.find('.srpFactor').html(factor);

  if (ship.setAt) {
    var setAtDate = new Date(ship.setAt);
    var dateStr = setAtDate.toUTCString();
    $('.setat', row).text(dateStr);
  }
  if (ship.setBy) $('.setby', row).text(ship.setBy);
}

function updateRow(row, shipid) {
  $.getJSON('/admin/srp/insurance/' + shipid, function(ship){
    setCells(row);
    populateRow(row, ship);
  });
}


function blurInputField() {
  var shipid = this.name;
  var row = $(this).closest('tr');
  var insurance = row.find('.insurance input');
  var srpFactor = row.find('.srpFactor input');
  var postData = {
    insurance: insurance.val(),
    srpFactor: srpFactor.val()
  };

  $.post('/admin/srp/insurance/' + shipid, postData  , function(data) {
    if (data != "Unchanged") {
      var dname = "#" + shipid + "_result";
      if (data == "OK")
        updateRow(row, shipid);
      else
        $.growl.warning({message: 'Could not set ' + shipid + '.', duration: 5000})
    }
  })
    .fail(function() {
      $.growl.error({message: 'Could not set ' + shipid + '.', duration: 5000})
    });
}
