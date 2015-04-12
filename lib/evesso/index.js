var url = require('url');
var http = require('http');
var https = require('https');
var querystring = require('querystring');

function authorize (req, res, next){
  var state = makecode();
  req.session.evessostate = state;

  var Settings = req.app.get("settings");
  var rdirUrl = url.parse(Settings.settings['sso-provider']);
  rdirUrl.pathname = 'oauth/authorize';
  rdirUrl.query = {
    response_type: 'code',
    redirect_uri: Settings.settings['sso-callback'],
    client_id: Settings.settings['sso-client-id'],
    scope: '',
    state: state
  };
  var redirect = url.format(rdirUrl);

  res.redirect(redirect);

}

function authenticate(req,callback){
  ;
    //console.log("Authenticating...");
    var code = req.query.code;
    var state = req.query.state;
    if (req.session.evessostate != state) {
      var err = new Error("Unknown state in callback from Eve server. Is cookies turned on?");
      err.status = 500;
      return callback(err);
    }

    //console.log("Access code: " + code);

    var Settings = req.app.get("settings");
    var rdirUrl = url.parse(Settings.settings['sso-provider']);
    var h = http;
    //console.log("Protocol: " + rdirUrl.protocol);
    if (rdirUrl.protocol == 'https:') {
      h = https;
      //console.log("Switching to https handler");
    }


    post_data = querystring.stringify({
      grant_type: 'authorization_code',
      code: code
    });

    var post_options = {
      hostname: rdirUrl.hostname,
      port: rdirUrl.port,
      path: '/oauth/token',
      method: 'POST',
      headers: {
        'Authorization': makeAuthHeader(Settings.settings['sso-client-id'] + ':' + Settings.settings['sso-secret']),
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': post_data.length
      }
    };

    //console.log("Sending POST request: " + JSON.stringify(post_options));
    //console.log("Body: " + post_data);

    var post_req = h.request(post_options, function(hres) {
      //console.log("hres");
      var data = "";
      hres.on('data', function(chunck) {
        //console.log("Received data: " + chunck);
        var tokenData = JSON.parse(chunck);
        if (tokenData.access_token)
          callback(null, tokenData);
        else
          callback(chunck); // use incoming as error message
      });
      hres.on('error', function(e) {
        var err = new Error(e.message);
        callback(err);
      });
    });
    post_req.write(post_data);
    post_req.end();

}

function verify(req, tokenData, callback) {
  //console.log("Verifying");
  var Settings = req.app.get("settings");
  var rdirUrl = url.parse(Settings.settings['sso-provider']);
  var h = http;
  if (rdirUrl.protocol == 'https:') {
    h = https;
  }
  var get_options = {
    hostname: rdirUrl.hostname,
    port: rdirUrl.port,
    path: '/oauth/verify',
    method: 'GET',
    headers: {
      Authorization: 'Bearer ' + tokenData.access_token,
      'User-Agent': 'BOLD Website'
    }
  };
  //console.log("Get-options: " + JSON.stringify(get_options));
  var get_request = h.request(get_options, function(res) {
    //console.log("In get");
    res.on('data', function(chunk) {
      console.log("Character info from server: " + chunk);
      var charData = JSON.parse(chunk)  ;
      callback (null, charData);
    });
    res.on('error', function(e) {
      //console.log("Error: " + e);
      callback(error);
    });
  });

  get_request.end();
}



module.exports.authorize = function() { return authorize; };
module.exports.authenticate =  authenticate;
module.exports.verify = verify;

function makeAuthHeader(up) {
  var b = new Buffer(up);
  var e = b.toString('base64');
  return 'Basic ' + e;
}

function makecode()
{
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 25; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}
