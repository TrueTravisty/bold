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
  }
  var redirect = url.format(rdirUrl);
  
  res.redirect(redirect);
  
}

function authenticate(req,callback){
  debugger;
    console.log("Authenticating...");
    var code = req.query.code;
    var state = req.query.state;
    if (req.session.evessostate != state) {
      var err = new Error("Unknown state");
      err.status = 500;
      return next(err);
    }
    
    var Settings = req.app.get("settings");
    var rdirUrl = url.parse(Settings.settings['sso-provider']);
    var h = http;
    if (rdirUrl.protocol == 'https') {
      h = https;
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
    
    console.log("Sending POST request: " + JSON.stringify(post_options));
   
    var post_req = h.request(post_options, function(hres) {
      console.log("hres");
      var data = "";
      hres.on('data', function(chunck) {
        console.log("Received data: " + chunk);
        var tokenData = JSON.parse(chunck);
        callback(null, tokenData);
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
  var Settings = req.app.get("settings");
  var rdirUrl = url.parse(Settings.settings['sso-provider']);
  var h = http;
  if (rdirUrl.protocol == 'https') {
    h = https;
  }
  var get_options = {
    hostname: rdirUrl.hostname,
    port: rdirUrl.port,
    path: '/oauth/verify',
    headers: {
      Authorization: 'Bearer ' + tokenData.access_token,
      'User-Agent': 'BOLD Website'
    }
  }
  h.get(get_options, function(res) {
    res.on('data', function(chunk) {
      var charData = JSON.parse(chunk)  ;
      callback (null, charData);
    })
    
  })
}



module.exports.authorize = function() { return authorize };
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