var request = require('request');

function inviteMember(settings, memberInfo,callback) {
  if (settings == null || memberInfo == null) return callback("Argument null");

  request.post({
    url: 'https://' + settings["slack-domain"] + '/api/users.admin.invite',
    form: {
      email: memberInfo.email,
      first_name: memberInfo.name,
      token: settings["slack-api"],
      set_active: true
    }
  }, function(err, httpResponse, body) {
      if (err) { return callback ("Slack Error " + err); }
      body = JSON.parse(body);
      if (body.ok) {
        return callback(null, "OK");
      } else {
        return callback(null, body.error);
      }
    })
}


exports.inviteMember = inviteMember;
