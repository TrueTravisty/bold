var Snoocore = require('snoocore');
var reddit = new Snoocore(
  {
    userAgent: "BO-LD Webpage, managed by /u/BO-LD_moderator",
  }
);



function addRedditUser(settings, reddit_user, callback) {
  login(settings).then(function(data) {
      addUser(settings, reddit_user, callback);
  }, function(err) {
    return callback(err);
  });
}

function login(settings) {
  var modhash = settings['reddit-modhash'];
  var cookie = settings['reddit-cookie'];

  if (!modhash || !cookie) {
    var err = new Error("Reddit settings missing");
    err.status = 500;
    return callback(err);
  }
  return reddit.login({
    modhash: modhash,
    cookie: cookie
  })
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

var threadcache = {};
var cacheTime = {
  corp: 0,
  bni: 0
};

function getThreadsFromCache(settings, count, callback) {
  var time = (new Date()).getTime();

  var ct = cacheTime.corp;
  var tc = threadcache.corp;

  if (!tc || tc.length < count || time - ct > 1000*60*5) {
    loginAndGetThreads(settings, count, callback)
  } else {
    callback(null, tc);
  }
}

function getBniThreadsFromCache(settings, count, callback) {
  var time = (new Date()).getTime();

  var ct = cacheTime.bni;
  var tc = threadcache.bni;

  if (!tc || tc.length < count || time - ct > 1000*60*5) {
    getThreads(settings, false, count, callback)
  } else {
    callback(null, tc);
  }
}

function loginAndGetThreads(settings, count, callback) {
  login(settings).then(function(data) {
    getThreads(settings, true, count, callback);
  }, function(err) {
    return callback(err);
  });
}

function getThreads(settings, corp, count, callback) {
  var subreddit = corp ? settings['reddit-subreddit'] : 'Bravenewbies';
  var cacheKey = corp ? 'corp' : 'bni';

  var promise = reddit('/r/$subreddit/hot').listing({
    $subreddit: subreddit,
    limit: count
  });
  promise.then(function(slice) {
    threadcache[cacheKey] = slice.allChildren;
    cacheTime[cacheKey] = (new Date()).getTime();
    return callback(null,threadcache[cacheKey]);
  },
  function(err) {
    return callback(err);
  });
}

exports.addUser = addRedditUser;
exports.getThreads = getThreadsFromCache;
exports.getBniThreads = getBniThreadsFromCache;
