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
    });

  request.post({
    url: 'https://' + settings["slack-domain"] + '/api/chat.postMessage',
    form: {
      channel: "#inviterequests",
      token: settings["slack-api"],
      username: "Webpage",
      text: memberInfo.name + ' requesting an invite to ' + memberInfo.email + '.'
    }
  }, function(err, httpResponse, body) {

  });

}

function getMemberList(settings, callback) {
  if (settings == null) return callback("Argument null");

  request.post({
    url: 'https://' + settings["slack-domain"] + '/api/users.list',
    form: {
      token: settings["slack-api"]
    }
  }, function (err, httpResponse, body) {
    if (err) return callback("Slack error: " + err);
    body = JSON.parse(body);
    if (body.ok) {
      return callback(null, body.members);
    } else {
      return callback(body.error);
    }
  });
}


exports.inviteMember = inviteMember;
exports.getMemberList = getMemberList;
