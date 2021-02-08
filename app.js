const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require('express-session');
const passport = require('passport');
const dotenv = require('dotenv');
const helmet = require('helmet');
const compression = require('compression');
const MongoStore = require('connect-mongo')(session);

dotenv.config();

const indexRouter = require('./routes/index');

const app = express();

const db = require('./modules/db');

const sessionStore = new MongoStore({
  mongooseConnection: db,
  collection: 'sessions',
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'", 'cdn.jsdelivr.net'],
        scriptSrc: ["'self'", 'cdn.jsdelivr.net'],
        styleSrc: ["'self'", 'cdn.jsdelivr.net'],
        fontSrc: ["'self'", 'cdn.jsdelivr.net'],
        imgSrc: ["'self' data:", 'cdn.jsdelivr.net'],
      },
    },
  }),
);
app.use(compression());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    store: sessionStore,
  }),
);

require('./modules/passport');

app.use(passport.initialize());
app.use(passport.session());

app.locals.moment = require('moment');

app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error', { title: 'Not found', user: req.user });
});

module.exports = app;
