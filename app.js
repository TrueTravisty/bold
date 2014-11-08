var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var flash = require('connect-flash');
var User = require('./model/User');

var utilities = require('./routes/utilities');
var routes = require('./routes/index');
var users = require('./routes/users');
var apiRoute = require('./routes/api');
var buyback = require('./routes/buyback');
var admin = require('./routes/admin');
var srp = require('./routes/srp');

var session = require('express-session');
var MongoStore = require('connect-mongo')(session);

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/boldsite');

var passport = require('passport'),
  OAuth2Strategy = require('passport-oauth').OAuth2Strategy;


var Settings = require('./model/SettingsStore');
var Character = require('./model/Character');

var schedule = require('node-schedule');
var zkbApi = require('./lib/zkbApi');


;
// use static authenticate method of model in LocalStrategy
passport.use(User.createStrategy());

Settings.populate(function(err) {
  if (err) throw err;

});
/*

*/

// use static serialize and deserialize of model for passport session support
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon(path.join(__dirname, 'public', 'images', 'bold.ico')));
app.use(logger('dev'));

app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded());

app.use(cookieParser('aløsjd fløaøljk os fpae afø ølsjf aø se ds'));
app.use(session({
    secret: 'aløsjd fløaøljk os fpae afø ølsjf aø se ds',
    saveUninitialized: true,
    resave: true,
    store: new MongoStore({
      db : 'boldsite',
    })
  }));

app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

app.set("settings", Settings);

// Make sure all views have access to username
app.use(function(req,res,next) {
  if (req.isAuthenticated()){
    res.locals.username = req.user.username;
    res.locals.user = req.user;
  } else {
    res.locals.username = "";
  }
  return next();
});

app.use('/', utilities); // THIS MUST BE BEFORE OTHER ROUTES
app.use('/', routes);
app.use('/', users);
app.use('/api/', apiRoute);
app.use('/', buyback);
app.use('/admin/', admin);
app.use('/srp', srp);

/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error.jade', {
            message: err.message,
            error: err
        });
    });
}

var numeral = require('numeral');

app.locals.iskify = function(number) {
  return numeral(number).format('0,0.00') + ' ISK';
}

app.locals.iskifya = function(number) {
  return numeral(number).format('0.0a') + ' ISK';
}


// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error.jade', {
        message: err.message,
        error: {}
    });
});

app.set('startZkillBoardSchedule', function registerZbkScheduler() {
  var rule = new schedule.RecurrenceRule();
  var now = new Date;
  rule.minute = [(now.getMinutes() + 2)%60, (now.getMinutes() + 12)%60,(now.getMinutes() + 22)%60,
  (now.getMinutes() + 32)%60,(now.getMinutes() + 42)%60,(now.getMinutes() + 52)%60];

  console.log("Setting scheduler to run every 10 minutes");

  var j = schedule.scheduleJob(rule, function(){
      console.log("Fetching zKillBoard data")
      zkbApi.fetchData(Settings.settings, false, function(err) {
        if (err) return console.log ('Error while fetching zKillBoard data: ' + err)
        console.log("Fetched lossmails");
        zkbApi.fetchData(Settings.settings, true, function(err) {
          if (err) return console.log ('Error while fetching zKillBoard data: ' + err)
          console.log("Fetched killmails");
        });
      });
  });
});


module.exports = app;
