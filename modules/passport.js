const passport = require('passport');
const bcrypt = require('bcryptjs');
const LocalStrategy = require('passport-local').Strategy;

const User = require('../models/user');

passport.use(
  new LocalStrategy(
    {
      usernameField: 'name',
    },
    (name, password, done) => {
      User.findOne({ name }, (err, user) => {
        if (err) {
          return done(err);
        }
        if (!user) {
          return done(null, false, { msg: 'Incorrect username' });
        }
        bcrypt.compare(password, user.password, (err, res) => {
          if (err) {
            return done(err);
          }
          if (res) {
            return done(null, user);
          }
          return done(null, false, { msg: 'Incorrect password' });
        });
      });
    },
  ),
);

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});
