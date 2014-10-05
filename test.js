var permissions = {
  manageusers: ['admin'],
  updatesite: ['admin'],
  updatenews: ['admin','contentprovider'],
  changeroles: ['superadmin']
}

var user1 = {
  username: 'torlivar',
  roles: ['superadmin','admin']
}
var user2 = {
  username: 'jens',
  roles: ['admin']
}

var user3= {
  username: 'dork',
  roles: []
}

var user4 = {
  username: 'helper',
  roles: ['contentprovider']
}

var req = {
  user: user1,
  isAuthenticated : function() {return true;}
}

req.can = function(verb) {
//if (req.username='torlivar') return true;
if (!req.isAuthenticated()) return false;
if (verb in permissions) {
    var i;
    var roles = permissions[verb];
    for (var i = 0; i < roles.length; i++) {
      if (req.user.roles.indexOf(roles[i]) >= 0) return true;
    }
  }
  if (req.user.roles.indexOf('superadmin') >= 0) return true; // superadmin can do all   
  return false;
};

var tests = ['manageusers', 'updatesite', 'changeroles', 'updatenews', 'unknownthing'];

var runTest = function(user) {
  req.user = user;
  for(var i = 0; i < tests.length; i++) {
    var test = tests[i];
    console.log(req.user.username + ' can ' + test + ': ' + req.can(test));
  }
};


runTest(user1);
runTest(user2);
runTest(user3);
runTest(user4);
