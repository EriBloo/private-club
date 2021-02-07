const express = require('express');
const router = express.Router();
const passport = require('passport');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const User = require('../models/user');
const Comment = require('../models/comment');

function checkAuthentication(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/log-in');
}

/* GET home page. */
router.get('/', function (req, res, next) {
  Comment.find()
    .populate('author')
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
});

router.post('/', [
  body('comment')
    .trim()
    .escape()
    .isLength({ min: 5 })
    .withMessage('Message must be at least of 5 characters'),
  function (req, res, next) {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      Comment.find()
        .populate('author')
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
  },
]);

router.get('/sign-up', (req, res) =>
  res.render('sign-up-form', { title: 'Create account' }),
);

router.post('/sign-up', [
  body('name')
    .trim()
    .escape()
    .isLength({ min: 3 })
    .withMessage('Username must be at least of length 3')
    .isAlphanumeric()
    .withMessage('Username contains non alphanumeric charaters')
    .custom(async (value) => {
      const result = await User.findOne({ name: value });
      if (result) {
        return Promise.reject();
      }
    })
    .withMessage('Name already taken'),
  body('password')
    .trim()
    .escape()
    .isLength({ min: 3 })
    .withMessage('Password must be at least of length 3')
    .custom((value, { req }) => value === req.body.confirm)
    .withMessage('Password confirmation must be the same as password field'),
  (req, res, next) => {
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
  },
]);

router.get('/log-in', (req, res) =>
  res.render('log-in-form', { title: 'Log in' }),
);

router.post('/log-in', [
  body('name').escape(),
  body('password').escape(),
  function (req, res, next) {
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
  },
]);
router.get('/log-out', (req, res) => {
  req.logout();
  res.redirect('/');
});

router.get('/member', checkAuthentication, (req, res) =>
  res.render('member-form', { title: 'Become a member', user: req.user }),
);

router.post('/member', [
  body('passcode')
    .escape()
    .custom((value) => {
      if (value === process.env.ADMIN_PASSCODE) {
        return true;
      }
      if (value === process.env.MEMBER_PASSCODE) {
        return true;
      }
      return false;
    }),
  (req, res, next) => {
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
  },
]);

module.exports = router;
