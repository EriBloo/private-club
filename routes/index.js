const express = require('express');
const router = express.Router();
const passport = require('passport');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const User = require('../models/user');

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Private club', user: req.user });
});

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

router.get('/log-in', (req, res) => res.render('log-in-form'));

router.post(
  '/log-in',
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/log-in',
  }),
);
router.get('/log-out', (req, res) => {
  req.logout();
  res.redirect('/');
});

module.exports = router;
