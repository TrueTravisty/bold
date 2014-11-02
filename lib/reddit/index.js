var Snoocore = require('snoocore');
var reddit = new Snoocore(
  {
    userAgent: "BO-LD Webpage, managed by /u/BO-LD_moderator",
  }
);

function addRedditUser(settings, reddit_user, callback) {
  var modhash = settings['reddit-modhash'];
  var cookie = settings['reddit-cookie'];

  if (!modhash || !cookie) {
    var err = new Error("Reddit settings missing");
    err.status = 500;
    return callback(err);
  }
  reddit.login({
    modhash: modhash,
    cookie: cookie
  }).then(function(data) {
      addUser(settings, reddit_user, callback);
  }, function(err) {
    return callback(err);
  });
}

function addUser(settings, reddit_user, callback) {
  var options = {
    container: settings['reddit-subredditfullname'],
    type: 'contributor',
    name: reddit_user,
    api_type: 'json',
    r: settings['reddit-subreddit'],
    id: '#contributor'
  };
  var promise = reddit('/api/friend').post(options);

  promise.then(function(data) {
    return callback();
  },
  function(err) {
    return callback(err)
  });
}

exports.addUser = addRedditUser;
