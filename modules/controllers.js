const passport = require('passport');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');

const User = require('../models/user');
const Comment = require('../models/comment');

exports.getIndex = (req, res, next) => {
  Comment.find()
    .populate('author')
    .sort({ date: 'asc' })
    .exec(function (err, results) {
      if (err) {
        next(err);
      }
      res.render('index', {
        title: 'Private Club',
        user: req.user,
        comments: results,
      });
    });
};

exports.postComment = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    Comment.find()
      .populate('author')
      .sort({ date: 'asc' })
      .exec(function (err, results) {
        if (err) {
          next(err);
        }
        res.render('index', {
          title: 'Private Club',
          user: req.user,
          errors: errors.errors,
          comments: results,
        });
      });
    return;
  }

  const newComment = new Comment({
    author: req.user,
    content: req.body.comment,
    date: new Date(),
  });

  newComment.save(function (err) {
    if (err) {
      next(err);
    }
    res.redirect('/');
  });
};

exports.getSignUp = (req, res) =>
  res.render('sign-up-form', { title: 'Create account' });

exports.postSignUp = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.render('sign-up-form', {
      title: 'Create account',
      errors: errors.errors,
    });
    return;
  }

  bcrypt.hash(req.body.password, 10, (err, hashedPassword) => {
    if (err) {
      next(err);
    }
    const user = new User({
      name: req.body.name,
      password: hashedPassword,
      rank: 0,
    }).save((err, savedUser) => {
      if (err) {
        return next(err);
      }
      req.login(savedUser, function (err) {
        if (err) {
          return next(err);
        }
        return res.redirect('/');
      });
    });
  });
};

exports.getLogIn = (req, res) => res.render('log-in-form', { title: 'Log in' });

exports.postLogIn = function (req, res, next) {
  passport.authenticate('local', function (err, user, info) {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.render('log-in-form', { title: 'Log in', errors: info });
    }
    req.login(user, function (err) {
      if (err) {
        next(err);
      }
      res.redirect('/');
    });
  })(req, res, next);
};

exports.getLogOut = (req, res) => {
  req.logout();
  res.redirect('/');
};

exports.getMember = (req, res) =>
  res.render('member-form', { title: 'Become a member', user: req.user });

exports.postMember = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.render('member-form', {
      title: 'Become a member',
      user: req.user,
      errors: errors.errors,
    });
    return;
  }

  User.findByIdAndUpdate(
    req.user.id,
    {
      rank: req.body.passcode === process.env.ADMIN_PASSCODE ? 2 : 1,
    },
    function (err) {
      if (err) {
        next(err);
      }
      res.redirect('/');
    },
  );
};

exports.postDelete = (req, res, next) => {
  Comment.findByIdAndDelete(req.params.id, function (err) {
    if (err) {
      next(err);
    }
    res.redirect('/');
  });
};
